import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-fallback';

// Extend Express Request type
export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token' });
    return;
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
        res.status(401).json({ error: 'Not authorized, user not found' });
        return;
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Admin access only' });
  }
};
