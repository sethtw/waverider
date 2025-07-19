/**
 * Waverider Analysis Engine Backend
 * @module index
 */

import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { analysisRoutes } from './routes/analysis.ts';
import { profileRoutes } from './routes/profiles.ts';
import { sessionRoutes } from './routes/sessions.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { logger } from './utils/logger.ts';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT: number = parseInt(process.env.PORT as string, 10) || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/analysis', analysisRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/sessions', sessionRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Waverider Analysis Engine running on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});

export { app as default, server }; 