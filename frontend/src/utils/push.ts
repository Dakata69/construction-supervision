function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function registerPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (Notification.permission === 'denied') return false;

  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!publicKey) return false;

  // Register service worker
  const reg = await navigator.serviceWorker.register('/service-worker.js');
  await navigator.serviceWorker.ready;

  // Ask permission if needed
  if (Notification.permission !== 'granted') {
    const p = await Notification.requestPermission();
    if (p !== 'granted') return false;
  }

  // Subscribe
  const existing = await reg.pushManager.getSubscription();
  const sub = existing || await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  try {
    // Send subscription to backend
    const body = sub.toJSON();
    const base = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000/api/';
    let token = '';
    try { token = localStorage.getItem('auth_token') || ''; } catch {}
    const resp = await fetch(base + 'push/subscribe/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error('subscribe failed');
  } catch (e) {
    // If failed, try to unsubscribe locally to avoid stale
    try { await sub.unsubscribe(); } catch {}
    return false;
  }
  return true;
}

export async function unregisterPush() {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return false;
  try {
    const body = sub.toJSON();
    const base = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000/api/';
    let token = '';
    try { token = localStorage.getItem('auth_token') || ''; } catch {}
    await fetch(base + 'push/unsubscribe/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ endpoint: body.endpoint }),
    });
  } catch {}
  try { await sub.unsubscribe(); } catch {}
  return true;
}
