/**
 * Profiles API routes
 * @module routes/profiles
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

const router = express.Router();
const log = logger.child({ service: 'profileRoutes' });

// In-memory storage for profiles (in production, use a database)
let profiles = [
  {
    id: 'quiet-profile',
    name: 'Quiet Section',
    description: 'Detects periods of low amplitude audio',
    type: 'quiet',
    parameters: {
      maxAmplitude: 0.1,
      minDuration: 2.0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: true,
  },
  {
    id: 'intensity-profile',
    name: 'High Intensity',
    description: 'Detects periods of high amplitude audio',
    type: 'intensity',
    parameters: {
      minAmplitude: 0.7,
      threshold: 0.8,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: true,
  },
  {
    id: 'transition-profile',
    name: 'Transition',
    description: 'Detects transition periods between quiet and loud',
    type: 'transition',
    parameters: {
      sensitivity: 0.5,
      windowSize: 1.0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: true,
  },
];

/**
 * GET /api/profiles
 * Get all profiles
 */
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    log.error('Failed to get profiles', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profiles'
    });
  }
});

/**
 * GET /api/profiles/:id
 * Get a specific profile
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const profile = profiles.find(p => p.id === id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    log.error('Failed to get profile', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile'
    });
  }
});

/**
 * POST /api/profiles
 * Create a new profile
 */
router.post('/', (req, res) => {
  try {
    const { name, description, type, parameters } = req.body;
    
    if (!name || !type || !parameters) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, parameters'
      });
    }
    
    const newProfile = {
      id: uuidv4(),
      name,
      description: description || '',
      type,
      parameters,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: false,
    };
    
    profiles.push(newProfile);
    
    log.info('Profile created', { id: newProfile.id, name: newProfile.name });
    
    res.status(201).json({
      success: true,
      data: newProfile
    });
  } catch (error) {
    log.error('Failed to create profile', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create profile'
    });
  }
});

/**
 * PUT /api/profiles/:id
 * Update a profile
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const profileIndex = profiles.findIndex(p => p.id === id);
    
    if (profileIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Don't allow updating default profiles
    if (profiles[profileIndex].isDefault) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify default profiles'
      });
    }
    
    const updatedProfile = {
      ...profiles[profileIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    profiles[profileIndex] = updatedProfile;
    
    log.info('Profile updated', { id, name: updatedProfile.name });
    
    res.json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    log.error('Failed to update profile', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * DELETE /api/profiles/:id
 * Delete a profile
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const profileIndex = profiles.findIndex(p => p.id === id);
    
    if (profileIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Don't allow deleting default profiles
    if (profiles[profileIndex].isDefault) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete default profiles'
      });
    }
    
    const deletedProfile = profiles.splice(profileIndex, 1)[0];
    
    log.info('Profile deleted', { id, name: deletedProfile.name });
    
    res.json({
      success: true,
      data: { message: 'Profile deleted successfully' }
    });
  } catch (error) {
    log.error('Failed to delete profile', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete profile'
    });
  }
});

/**
 * POST /api/profiles/:id/test
 * Test a profile with sample data
 */
router.post('/:id/test', (req, res) => {
  try {
    const { id } = req.params;
    const { audioData, options = {} } = req.body;
    
    const profile = profiles.find(p => p.id === id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    if (!audioData || !Array.isArray(audioData)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid audio data format'
      });
    }
    
    // Convert array to Float32Array
    const float32Data = new Float32Array(audioData);
    
    // Test the profile
    const testResults = {
      profile: profile,
      sampleCount: float32Data.length,
      testTimestamp: new Date().toISOString(),
      // TODO: Implement actual profile testing
      message: 'Profile testing not yet implemented'
    };
    
    res.json({
      success: true,
      data: testResults
    });
  } catch (error) {
    log.error('Failed to test profile', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test profile'
    });
  }
});

export { router as profileRoutes }; 