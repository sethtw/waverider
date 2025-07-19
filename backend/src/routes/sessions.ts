/**
 * Sessions API routes
 * @module routes/sessions
 */

import express, { Router } from 'express';
import {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  exportSession,
  importSession
} from '../controllers/sessions.ts';

const router: Router = express.Router();

router.get('/', getSessions);
router.get('/:id', getSessionById);
router.post('/', createSession);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);
router.post('/:id/export', exportSession);
router.post('/import', importSession);

export { router as sessionRoutes }; 