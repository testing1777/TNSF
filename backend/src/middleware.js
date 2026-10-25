import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { User } from './models.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub).select('_id name email role active');
    if (!user || !user.active) return res.status(401).json({ error: 'Account unavailable' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};
