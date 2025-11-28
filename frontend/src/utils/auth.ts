// Decode JWT token to extract user data
export function decodeToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

export function getUserFromToken(token: string): any {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  return {
    id: decoded.user_id,
    role: decoded.role || 'privileged',
    // Note: JWT doesn't contain full user data, we'll need to fetch it
  };
}
