function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function registerPush(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported by browser');
      return { success: false, error: 'Браузърът не поддържа push известия' };
    }
    if (Notification.permission === 'denied') {
      console.warn('Push notifications denied by user');
      return { success: false, error: 'Известията са отказани. Оправете разрешението в настройките' };
    }

    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
    if (!publicKey) {
      console.warn('VAPID public key not configured');
      return { success: false, error: 'VAPID ключът не е конфигуриран' };
    }

    // Register service worker
    console.log('Registering service worker...');
    const reg = await navigator.serviceWorker.register('/service-worker.js');
    await navigator.serviceWorker.ready;
    console.log('Service worker registered');

    // Ask permission if needed
    if (Notification.permission !== 'granted') {
      console.log('Requesting notification permission...');
      const p = await Notification.requestPermission();
      if (p !== 'granted') {
        console.warn('Notification permission denied');
        return { success: false, error: 'Разрешението за известия е отказано' };
      }
    }

    // Subscribe
    console.log('Creating push subscription...');
    const existing = await reg.pushManager.getSubscription();
    
    // If existing subscription, unsubscribe first to get fresh one
    if (existing) {
      console.log('Found existing subscription, refreshing...');
      try {
        await existing.unsubscribe();
      } catch (err) {
        console.warn('Could not unsubscribe existing subscription:', err);
      }
    }
    
    // Create new subscription with retry logic
    let sub;
    let retries = 3;
    while (retries > 0) {
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        console.log('Push subscription created:', sub);
        break;
      } catch (err) {
        retries--;
        console.warn(`Subscription attempt failed (${3 - retries}/3):`, err);
        
        if (retries === 0) {
          // Provide helpful error message based on error type
          const errorMsg = err instanceof Error ? err.message : String(err);
          if (errorMsg.includes('Registration failed') || errorMsg.includes('push service')) {
            throw new Error('Грешка при регистрация с push услугата. Моля опитайте:\n' +
              '1. Презаредете страницата\n' +
              '2. Изчистете кеша на браузъра\n' +
              '3. Използвайте Incognito/Private режим\n' +
              '4. Опитайте друг браузър (Chrome/Firefox/Edge)');
          }
          throw err;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!sub) {
      throw new Error('Не успя създаването на push subscription след няколко опита');
    }

    // Send subscription to backend
    const body = sub.toJSON();
    const base = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000/api/';
    let token = '';
    try { token = localStorage.getItem('auth_token') || ''; } catch {}
    
    if (!token) {
      console.error('No auth token found');
      await sub.unsubscribe();
      return { success: false, error: 'Не е намерена валидна сесия. Моля, влезте отново' };
    }
    
    console.log('Sending subscription to backend...');
    const resp = await fetch(base + 'push/subscribe/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('Backend subscription failed:', resp.status, errorText);
      await sub.unsubscribe();
      return { success: false, error: `Грешка от сървъра (${resp.status})` };
    }
    
    console.log('Push notification registration successful');
    return { success: true };
  } catch (e) {
    console.error('Push registration error:', e);
    const errorMsg = e instanceof Error ? e.message : String(e);
    // Try to unsubscribe if subscription was created
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
    } catch {}
    return { success: false, error: `Грешка: ${errorMsg}` };
  }
}

export async function unregisterPush() {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported');
      return false;
    }
    
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      console.warn('No service worker registered');
      return false;
    }
    
    const sub = await reg.pushManager.getSubscription();
    if (!sub) {
      console.log('No push subscription found');
      return true;
    }

    console.log('Unregistering push subscription from backend...');
    const body = sub.toJSON();
    const base = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000/api/';
    let token = '';
    try { token = localStorage.getItem('auth_token') || ''; } catch {}
    
    try {
      const resp = await fetch(base + 'push/unsubscribe/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ endpoint: body.endpoint }),
      });
      
      if (!resp.ok) {
        console.warn('Backend unsubscribe failed:', resp.status);
      }
    } catch (e) {
      console.error('Error unsubscribing from backend:', e);
    }

    // Always unsubscribe locally
    console.log('Unsubscribing from push manager...');
    await sub.unsubscribe();
    console.log('Push notification unregistration successful');
    return true;
  } catch (e) {
    console.error('Push unregistration error:', e);
    return false;
  }
}
