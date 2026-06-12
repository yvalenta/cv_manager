import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
};
