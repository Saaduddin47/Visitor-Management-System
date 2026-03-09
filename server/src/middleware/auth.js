import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export const signToken = (payload) => jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const shouldUseCrossSiteCookie = () => {
  const clientUrl = (env.clientUrl || '').toLowerCase();
  const isHttpsClient = clientUrl.startsWith('https://');
  const isLocalClient = clientUrl.includes('localhost') || clientUrl.includes('127.0.0.1');
  return isHttpsClient && !isLocalClient;
};

export const setAuthCookie = (res, token) => {
  const crossSite = shouldUseCrossSiteCookie();
  const secure = crossSite || env.nodeEnv === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure,
    sameSite: crossSite ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });
};

export const clearAuthCookie = (res) => {
  const crossSite = shouldUseCrossSiteCookie();
  const secure = crossSite || env.nodeEnv === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure,
    sameSite: crossSite ? 'none' : 'lax'
  });
};

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;

    const token = req.cookies?.token || bearerToken;
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
