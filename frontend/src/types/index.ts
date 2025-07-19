/**
 * Core type definitions for the Waverider audio analysis application
 * @module types
 */

// ============================================================================
// Audio Input Types
// ============================================================================

export interface AudioSource {
  id: string;
  name: string;
  type: 'file' | 'url' | 'youtube';
  source: string;
  duration: number;
  sampleRate: number;
  channels: number;
  loadedAt: Date;
  metadata?: AudioMetadata;
}

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
  bitrate?: number;
  format?: string;
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
  [key: string]: any; // Allow other properties
}

export interface RegionMetadata {
  confidence?: number;
  amplitude?: number;
  notes?: string;
  tags?: string[];
}

// ============================================================================
// Analysis Types
// ============================================================================

export interface AudioAnalysis {
  id: string;
  audioSourceId: string;
  regions: AudioRegion[];
  profiles: AudioProfile[];
  analysisDate: Date;
  version: string;
  analysis: {
    amplitude: any;
    spectral: any;
    patterns: any;
    regions: any;
  }
}

export interface AnalysisResult {
  region: AudioRegion;
  confidence: number;
  matchedProfile: AudioProfile;
  analysisData: AnalysisData;
}

export interface AnalysisData {
  averageAmplitude: number;
  peakAmplitude: number;
  rmsValue: number;
  spectralCentroid?: number;
  zeroCrossingRate?: number;
}

// ============================================================================
// Session Types
// ============================================================================

export interface AudioSession {
  id: string;
  name: string;
  audioSource: AudioSource;
  analysis: AudioAnalysis;
  playbackSettings: PlaybackSettings;
  regions: AudioRegion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaybackSettings {
  volume: number;
  speed: number;
  selectedRegions: string[];
  loopEnabled: boolean;
  envelopePoints: EnvelopePoint[];
}

export interface EnvelopePoint {
  time: number;
  volume: number;
}

// ============================================================================
// State Types
// ============================================================================

export interface AppState {
  theme: 'light' | 'dark';
  currentSession: AudioSession | null;
  sessions: AudioSession[];
  profiles: AudioProfile[];
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Event Types
// ============================================================================

export interface AudioEvent {
  type: 'play' | 'pause' | 'seek' | 'volume' | 'speed';
  timestamp: number;
  data: any;
}

export interface RegionEvent {
  type: 'create' | 'update' | 'delete' | 'select';
  regionId: string;
  timestamp: number;
  data: any;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
} 