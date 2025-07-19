/**
 * Analysis API routes
 * @module routes/analysis
 */

import express, { Router } from 'express';
import multer from 'multer';
import {
  analyzeAudio,
  analyzeFile,
  detectRegions,
  detectPatterns,
  analyzeSpectral,
  getStatus
} from '../controllers/analysis.ts';

const router: Router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

router.post('/analyze', analyzeAudio);
router.post('/analyze-file', upload.single('audio'), analyzeFile);
router.post('/regions', detectRegions);
router.post('/patterns', detectPatterns);
router.post('/spectral', analyzeSpectral);
router.get('/status', getStatus);

export { router as analysisRoutes }; 