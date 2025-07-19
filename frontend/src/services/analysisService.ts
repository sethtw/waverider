/**
 * Analysis service for communicating with the backend analysis engine
 * @module services/analysisService
 */

import { logger } from '../utils/logger';
import type { 
  AudioAnalysis, 
  AnalysisResult, 
  AudioProfile, 
  AudioRegion,
  AudioSession 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.PORT || 3000}/api`;

class AnalysisService {
  private log = logger.child('analysisService');

  /**
   * Analyze audio data
   */
  async analyzeAudio(audioData: Float32Array, options: any = {}): Promise<AudioAnalysis> {
    try {
      this.log.info('Sending analysis request', { 
        sampleCount: audioData.length,
        options 
      });

      const response = await fetch(`${API_BASE_URL}/analysis/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: Array.from(audioData),
          options
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      this.log.info('Analysis completed successfully', { 
        resultId: result.data.id 
      });

      return result.data;
    } catch (error) {
      this.log.error('Analysis request failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Detect regions using profiles
   */
  async detectRegions(audioData: Float32Array, profiles: AudioProfile[], options: any = {}): Promise<AudioRegion[]> {
    try {
      this.log.info('Sending region detection request', { 
        sampleCount: audioData.length,
        profileCount: profiles.length 
      });

      const response = await fetch(`${API_BASE_URL}/analysis/regions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: Array.from(audioData),
          profiles,
          options
        }),
      });

      if (!response.ok) {
        throw new Error(`Region detection failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Region detection failed');
      }

      this.log.info('Region detection completed', { 
        regionCount: result.data.count 
      });

      return result.data.regions;
    } catch (error) {
      this.log.error('Region detection request failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Detect patterns in audio data
   */
  async detectPatterns(audioData: Float32Array, options: any = {}): Promise<any> {
    try {
      this.log.info('Sending pattern detection request', { 
        sampleCount: audioData.length,
        options 
      });

      const response = await fetch(`${API_BASE_URL}/analysis/patterns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: Array.from(audioData),
          options
        }),
      });

      if (!response.ok) {
        throw new Error(`Pattern detection failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Pattern detection failed');
      }

      this.log.info('Pattern detection completed');
      return result.data;
    } catch (error) {
      this.log.error('Pattern detection request failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Perform spectral analysis
   */
  async analyzeSpectral(audioData: Float32Array, options: any = {}): Promise<any> {
    try {
      this.log.info('Sending spectral analysis request', { 
        sampleCount: audioData.length,
        options 
      });

      const response = await fetch(`${API_BASE_URL}/analysis/spectral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: Array.from(audioData),
          options
        }),
      });

      if (!response.ok) {
        throw new Error(`Spectral analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Spectral analysis failed');
      }

      this.log.info('Spectral analysis completed');
      return result.data;
    } catch (error) {
      this.log.error('Spectral analysis request failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get analysis engine status
   */
  async getStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/status`);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Status check failed');
      }

      return result.data;
    } catch (error) {
      this.log.error('Status check failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get all profiles
   */
  async getProfiles(): Promise<AudioProfile[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles`);
      
      if (!response.ok) {
        throw new Error(`Failed to get profiles: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get profiles');
      }

      return result.data;
    } catch (error) {
      this.log.error('Failed to get profiles', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Create a new profile
   */
  async createProfile(profile: Omit<AudioProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<AudioProfile> {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error(`Failed to create profile: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create profile');
      }

      this.log.info('Profile created', { id: result.data.id });
      return result.data;
    } catch (error) {
      this.log.error('Failed to create profile', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Update a profile
   */
  async updateProfile(id: string, updates: Partial<AudioProfile>): Promise<AudioProfile> {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update profile: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      this.log.info('Profile updated', { id });
      return result.data;
    } catch (error) {
      this.log.error('Failed to update profile', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Delete a profile
   */
  async deleteProfile(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete profile: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete profile');
      }

      this.log.info('Profile deleted', { id });
    } catch (error) {
      this.log.error('Failed to delete profile', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get all sessions
   */
  async getSessions(): Promise<AudioSession[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`);
      
      if (!response.ok) {
        throw new Error(`Failed to get sessions: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get sessions');
      }

      return result.data;
    } catch (error) {
      this.log.error('Failed to get sessions', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Create a new session
   */
  async createSession(session: Omit<AudioSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<AudioSession> {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create session');
      }

      this.log.info('Session created', { id: result.data.id });
      return result.data;
    } catch (error) {
      this.log.error('Failed to create session', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Update a session
   */
  async updateSession(id: string, updates: Partial<AudioSession>): Promise<AudioSession> {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update session');
      }

      this.log.info('Session updated', { id });
      return result.data;
    } catch (error) {
      this.log.error('Failed to update session', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete session');
      }

      this.log.info('Session deleted', { id });
    } catch (error) {
      this.log.error('Failed to delete session', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}

export const analysisService = new AnalysisService(); 