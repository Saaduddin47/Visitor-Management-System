import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export const signToken = (payload) => jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie('token');
};

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.sub).select('-passwordHash');

    if (!user || !user.isActive) return res.status(401).json({ message: 'Unauthorized' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  next();
};
