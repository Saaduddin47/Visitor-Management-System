import validator from 'validator';
import { AppError } from './AppError.js';

export const requiredString = (value, field, max = 2000) => {
  const normalized = `${value ?? ''}`.trim();
  if (!normalized) throw new AppError(`${field} is required`, 400);
  if (normalized.length > max) throw new AppError(`${field} is too long`, 400);
  return validator.escape(normalized);
};

export const requiredEmail = (value, field = 'Email') => {
  const normalized = `${value ?? ''}`.trim().toLowerCase();
  if (!validator.isEmail(normalized)) throw new AppError(`${field} is invalid`, 400);
  return normalized;
};
