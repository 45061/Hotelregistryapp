export function getUserFromToken() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )token=([^;]+)/);
  if (!match) return null;
  try {
    const token = decodeURIComponent(match[1]);
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id,
      isAdmin: payload.isAdmin,
      authorized: payload.authorized,
      isSuperUser: payload.isSuperUser,
      cashRole: payload.cashRole,
    };
  } catch (error) {
    return null;
  }
}
