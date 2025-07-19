/**
 * Profiles API routes
 * @module routes/profiles
 */

import express, { Router } from 'express';
import {
  getProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  testProfile
} from '../controllers/profiles.ts';

const router: Router = express.Router();

router.get('/', getProfiles);
router.get('/:id', getProfileById);
router.post('/', createProfile);
router.put('/:id', updateProfile);
router.delete('/:id', deleteProfile);
router.post('/:id/test', testProfile);

export { router as profileRoutes }; 