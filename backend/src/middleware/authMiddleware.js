import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwt.js';

export function ensureAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: { code: 'NO_AUTH' } });
  const token = header.replace('Bearer ', '');
  try {
    const SECRET = getJwtSecret();
    const payload = jwt.verify(token, SECRET);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN' } });
  }
}

export function ensureRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: { code: 'NO_AUTH' } });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    }
    return next();
  };
}
