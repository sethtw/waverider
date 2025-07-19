/**
 * Shared type definitions for the Waverider audio analysis application
 * @module shared/types
 */

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// Audio Profile Types
// ============================================================================

export interface AudioProfile {
  id: string;
  name: string;
  description: string;
  type: ProfileType;
  parameters: ProfileParameters;
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean;
}

export type ProfileType =
  | 'quiet'
  | 'intensity'
  | 'transition'
  | 'custom';

export interface ProfileParameters {
  // Quiet profile parameters
  maxAmplitude?: number;
  minDuration?: number;

  // Intensity profile parameters
  minAmplitude?: number;
  threshold?: number;

  // Transition profile parameters
  sensitivity?: number;
  windowSize?: number;

  // Custom parameters
  [key: string]: any;
}

// ============================================================================
// Region Types
// ============================================================================

export interface AudioRegion {
  id: string;
  start: number;
  end: number;
  label?: string;
  color?: string;
  data?: { [key: string]: any };
  confidence?: number;
  profile?: string;
}

// ============================================================================
// Analysis Types
// ============================================================================

export interface AudioAnalysis {
  id: string;
  timestamp: string;
  sampleCount: number;
  analysis: {
    amplitude: Record<string, unknown>;
    spectral: Record<string, unknown>;
    patterns: Record<string, unknown>;
    regions: AudioRegion[];
  };
}

// ============================================================================
// Session Types
// ============================================================================

export interface AudioSession {
  id: string;
  name: string;
  audioSource: any;
  analysis: AudioAnalysis | null;
  playbackSettings: any;
  regions: AudioRegion[];
  createdAt: Date;
  updatedAt: Date;
} 