/**
 * Analysis API routes
 * @module routes/analysis
 */

import express from 'express';
import multer from 'multer';
import { analysisEngine } from '../services/analysisEngine.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const log = logger.child({ service: 'analysisRoutes' });

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

/**
 * POST /api/analysis/analyze
 * Analyze audio data
 */
router.post('/analyze', async (req, res, next) => {
  try {
    const { audioData, options = {} } = req.body;
    
    if (!audioData || !Array.isArray(audioData)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid audio data format'
      });
    }

    log.info('Analysis request received', { 
      sampleCount: audioData.length,
      options 
    });

    // Convert array to Float32Array
    const float32Data = new Float32Array(audioData);
    
    // Perform analysis
    const results = await analysisEngine.analyzeAudio(float32Data, options);
    
    res.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    log.error('Analysis failed', error);
    next(error);
  }
});

/**
 * POST /api/analysis/analyze-file
 * Analyze uploaded audio file
 */
router.post('/analyze-file', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const { options = {} } = req.body;
    
    log.info('File analysis request received', { 
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // TODO: Implement audio file processing
    // For now, return a placeholder response
    res.json({
      success: true,
      data: {
        id: 'placeholder-analysis-id',
        timestamp: new Date().toISOString(),
        message: 'File analysis not yet implemented',
        filename: req.file.originalname
      }
    });
    
  } catch (error) {
    log.error('File analysis failed', error);
    next(error);
  }
});

/**
 * POST /api/analysis/regions
 * Detect regions based on profiles
 */
router.post('/regions', async (req, res, next) => {
  try {
    const { audioData, profiles = [], options = {} } = req.body;
    
    if (!audioData || !Array.isArray(audioData)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid audio data format'
      });
    }

    log.info('Region detection request received', { 
      sampleCount: audioData.length,
      profileCount: profiles.length
    });

    // Convert array to Float32Array
    const float32Data = new Float32Array(audioData);
    
    // Detect regions using profiles
    const regions = analysisEngine.detectRegions(float32Data, {
      ...options,
      profiles
    });
    
    res.json({
      success: true,
      data: {
        regions,
        count: regions.length,
        profiles: profiles.map(p => p.id)
      }
    });
    
  } catch (error) {
    log.error('Region detection failed', error);
    next(error);
  }
});

/**
 * POST /api/analysis/patterns
 * Detect patterns in audio data
 */
router.post('/patterns', async (req, res, next) => {
  try {
    const { audioData, options = {} } = req.body;
    
    if (!audioData || !Array.isArray(audioData)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid audio data format'
      });
    }

    log.info('Pattern detection request received', { 
      sampleCount: audioData.length,
      options 
    });

    // Convert array to Float32Array
    const float32Data = new Float32Array(audioData);
    
    // Detect patterns
    const patterns = analysisEngine.detectPatterns(float32Data, options);
    
    res.json({
      success: true,
      data: patterns
    });
    
  } catch (error) {
    log.error('Pattern detection failed', error);
    next(error);
  }
});

/**
 * POST /api/analysis/spectral
 * Perform spectral analysis
 */
router.post('/spectral', async (req, res, next) => {
  try {
    const { audioData, options = {} } = req.body;
    
    if (!audioData || !Array.isArray(audioData)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid audio data format'
      });
    }

    log.info('Spectral analysis request received', { 
      sampleCount: audioData.length,
      options 
    });

    // Convert array to Float32Array
    const float32Data = new Float32Array(audioData);
    
    // Perform spectral analysis
    const spectral = analysisEngine.analyzeSpectral(float32Data, options);
    
    res.json({
      success: true,
      data: spectral
    });
    
  } catch (error) {
    log.error('Spectral analysis failed', error);
    next(error);
  }
});

/**
 * GET /api/analysis/status
 * Get analysis engine status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      capabilities: [
        'amplitude_analysis',
        'spectral_analysis',
        'pattern_detection',
        'region_detection'
      ]
    }
  });
});

export { router as analysisRoutes }; 