import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types/auth';
import { ErrorResponse } from '../types/error';
import { logger } from '../utils/logger';

/**
 * Authentication middleware that validates JWT tokens
 * Extracts token from Authorization header and attaches user info to request
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    logger.warn('AuthMiddleware', 'Missing authorization token');
    const errorResponse: ErrorResponse = {
      message: 'Authentication required. Please provide a valid token.',
      errors: [],
    };
    res.status(401).json(errorResponse);
    return;
  }

  try {
    const payload = verifyToken(token);
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: payload.email,
    };
    next();
  } catch (error) {
    logger.warn('AuthMiddleware', 'Invalid token', error);
    const errorResponse: ErrorResponse = {
      message: 'Invalid or expired token. Please login again.',
      errors: [],
    };
    res.status(401).json(errorResponse);
  }
}
