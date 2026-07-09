import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Verifies the Bearer token and attaches { id, email } to req.user. Stateless
// by design (no DB lookup here) - controllers that need the full record
// should fetch it themselves, as auth.controller.js's `me` handler does.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: { message: 'Missing or invalid Authorization header' } });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
}
