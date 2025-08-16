import jwt from 'jsonwebtoken';

export function getUserFromToken() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )token=([^;]+)/);
  if (!match) return null;
  try {
    const token = decodeURIComponent(match[1]);
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded !== 'object') return null;
    return {
      id: decoded.id as string,
      isAdmin: decoded.isAdmin as boolean,
      authorized: decoded.authorized as boolean,
      isSuperUser: decoded.isSuperUser as boolean,
      cashRole: decoded.cashRole as string | undefined,
    };
  } catch (error) {
    return null;
  }
}
