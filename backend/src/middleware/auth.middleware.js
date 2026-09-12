import jwt from 'jsonwebtoken';

// Attach this to any route that requires a logged-in user.
// On success it sets req.userId; on failure it responds 401 itself.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Attach after requireAuth to restrict a route to specific roles,
// e.g. requireRole('organizer', 'admin')
export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    const { pool } = await import('../db/pool.js');
    const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [req.userId]);
    if (!rows.length || !allowedRoles.includes(rows[0].role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
