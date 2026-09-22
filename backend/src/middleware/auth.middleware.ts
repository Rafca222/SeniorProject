import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as { sub: string; role: string };
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Attach after requireAuth to restrict a route to specific roles,
// e.g. requireRole('organizer', 'admin'). Reads the role straight off
// the already-verified access token -- no extra database call needed.
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
