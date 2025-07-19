/**
 * Controllers for profiles API
 * @module controllers/profiles
 */

import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.ts';
import type { AudioProfile, ApiResponse } from '../../../shared/types/index.ts';
import { profiles } from '../data/db.ts';

const log = logger.child({ service: 'profilesController' });

export const getProfiles = (req: Request, res: Response<ApiResponse<AudioProfile[]>>) => {
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
};

export const getProfileById = (req: Request, res: Response<ApiResponse<AudioProfile>>) => {
  try {
    const { id } = req.params;
    const profile = profiles.find((p: AudioProfile) => p.id === id);
    
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
};

export const createProfile = (req: Request, res: Response<ApiResponse<AudioProfile>>) => {
  try {
    const { name, description, type, parameters }: AudioProfile = req.body;
    
    if (!name || !type || !parameters) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, parameters'
      });
    }
    
    const newProfile: AudioProfile = {
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
};

export const updateProfile = (req: Request, res: Response<ApiResponse<AudioProfile>>) => {
  try {
    const { id } = req.params;
    const updates: Partial<AudioProfile> = req.body;
    
    const profileIndex = profiles.findIndex((p: AudioProfile) => p.id === id);

    if (profileIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    if (profiles[profileIndex].isDefault) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify default profiles'
      });
    }
    
    const updatedProfile: AudioProfile = {
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
};

export const deleteProfile = (req: Request, res: Response<ApiResponse<{ message: string }>>) => {
  try {
    const { id } = req.params;
    
    const profileIndex = profiles.findIndex((p: AudioProfile) => p.id === id);
    
    if (profileIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
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
};

export const testProfile = (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const { audioData, options = {} }: { audioData: number[]; options?: Record<string, unknown> } = req.body;
    
    const profile = profiles.find((p: AudioProfile) => p.id === id);
    
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
    
    const float32Data = new Float32Array(audioData);
    
    const testResults = {
      profile: profile,
      sampleCount: float32Data.length,
      testTimestamp: new Date().toISOString(),
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
}; 