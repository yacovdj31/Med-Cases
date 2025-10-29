// import jwt from 'jsonwebtoken';
// import { cfg } from '../config.js';


// export function auth(requiredRole) {
// return (req, res, next) => {
// const token = req.headers.authorization?.replace('Bearer ', '');
// if (!token) return res.status(401).json({ error: 'No token' });
// try {
// const payload = jwt.verify(token, cfg.jwtSecret);
// req.user = payload; // { id, role }
// if (requiredRole && payload.role !== requiredRole) {
// return res.status(403).json({ error: 'Forbidden' });
// }
// next();
// } catch (e) {
// return res.status(401).json({ error: 'Invalid token' });
// }
// };
// }

import jwt from 'jsonwebtoken';
import { cfg } from '../config.js';

export function auth(requiredRole) {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
      const payload = jwt.verify(token, cfg.jwtSecret);
      req.user = payload; // { id, email, role, name }
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
