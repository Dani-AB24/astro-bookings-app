import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-change-in-production';

/**
 * Generates a JWT token for a user
 */
export function generateToken(userId: string, email: string): string {
  const payload: JWTPayload = { userId, email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verifies and decodes a JWT token
 * Returns the payload if valid, throws if invalid
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
