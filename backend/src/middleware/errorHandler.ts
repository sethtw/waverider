/**
 * Error handling middleware
 * @module middleware/errorHandler
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.ts';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  const log = logger.child({ service: 'errorHandler' });
  
  // Log the error
  log.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Determine error type and response
  let statusCode: number = err.statusCode || 500;
  let message: string = 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource Not Found';
  } else if (err.code === 'ENOENT') {
    statusCode = 404;
    message = 'File Not Found';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File Too Large';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}; 