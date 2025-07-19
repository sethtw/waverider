/**
 * Controllers for analysis API
 * @module controllers/analysis
 */

import type { Request, Response, NextFunction } from 'express';
import { analysisEngine } from '../services/analysisEngine.ts';
import { logger } from '../utils/logger.ts';
import type { AudioProfile } from '../types.ts';

const log = logger.child({ service: 'analysisController' });

export const analyzeAudio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { audioData, options = {} }: { audioData: number[]; options?: Record<string, unknown> } = req.body;
    
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
};

export const analyzeFile = async (req: Request, res: Response, next: NextFunction) => {
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
};

export const detectRegions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { audioData, profiles, options = {} }: { audioData: number[]; profiles: AudioProfile[]; options?: Record<string, unknown> } = req.body;
    
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
        profiles: profiles.map((p: AudioProfile) => p.id)
      }
    });
    
  } catch (error) {
    log.error('Region detection failed', error);
    next(error);
  }
};

export const detectPatterns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { audioData, options = {} }: { audioData: number[]; options?: Record<string, unknown> } = req.body;
    
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
};

export const analyzeSpectral = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { audioData, options = {} }: { audioData: number[]; options?: Record<string, unknown> } = req.body;
    
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
};

export const getStatus = (req: Request, res: Response) => {
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
}; 