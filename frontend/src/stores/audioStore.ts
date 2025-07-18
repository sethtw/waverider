/**
 * Audio state management store
 * @module stores/audioStore
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type WaveSurfer from 'wavesurfer.js';
import { logger } from '../utils/logger';
import type { 
  AudioSource, 
  AudioSession, 
  AudioRegion, 
  AudioProfile,
  PlaybackSettings,
  EnvelopePoint 
} from '../types';
import { generateId, getFromStorage, setToStorage } from '../utils';

interface AudioState {
  // Audio source
  currentSource: AudioSource | null;
  isLoading: boolean;
  error: string | null;
  isReady: boolean;
  
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  speed: number;
  
  // Wavesurfer instance
  wavesurfer: WaveSurfer | null;

  // Regions and analysis
  regions: AudioRegion[];
  selectedRegions: string[];
  profiles: AudioProfile[];
  
  // Envelope
  envelopePoints: EnvelopePoint[];
  
  // Sessions
  sessions: AudioSession[];
  currentSession: AudioSession | null;
}

interface AudioActions {
  // Audio loading
  loadAudio: (source: AudioSource) => Promise<void>;
  clearAudio: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setReady: (isReady: boolean) => void;
  
  // Wavesurfer instance
  setWavesurfer: (wavesurfer: WaveSurfer | null) => void;

  // Playback controls
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setSpeed: (speed: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  
  // Regions management
  addRegion: (region: AudioRegion) => void;
  updateRegion: (id: string, updates: Partial<AudioRegion>) => void;
  removeRegion: (id: string) => void;
  selectRegion: (id: string, selected?: boolean) => void;
  clearRegions: () => void;
  
  // Profiles management
  addProfile: (profile: Omit<AudioProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProfile: (id: string, updates: Partial<AudioProfile>) => void;
  removeProfile: (id: string) => void;
  
  // Envelope management
  addEnvelopePoint: (point: EnvelopePoint) => void;
  updateEnvelopePoint: (index: number, point: EnvelopePoint) => void;
  removeEnvelopePoint: (index: number) => void;
  clearEnvelope: () => void;
  
  // Session management
  saveSession: (name: string) => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  exportSession: (sessionId: string) => string;
  importSession: (sessionData: string) => void;
}

type AudioStore = AudioState & AudioActions;

// Default profiles
const defaultProfiles: AudioProfile[] = [
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

export const useAudioStore = create<AudioStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentSource: null,
    isLoading: false,
    error: null,
    isReady: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    speed: 1,

    // Wavesurfer instance
    wavesurfer: null,
    
    // Regions and analysis
    regions: [],
    selectedRegions: [],
    profiles: defaultProfiles,
    envelopePoints: [],
    sessions: [],
    currentSession: null,

    // Audio loading actions
    loadAudio: async (source: AudioSource) => {
      const log = logger.child('audioStore');
      log.info('Loading audio source', { source: source.name });
      
      set({ isLoading: true, error: null });
      
      try {
        // Validate audio source
        if (!source.source) {
          throw new Error('Invalid audio source');
        }
        
        // For file sources, we need to ensure the URL is accessible
        let audioUrl = source.source;
        if (source.type === 'file' && source.source.startsWith('blob:')) {
          // The blob URL is already created by the file input
          audioUrl = source.source;
        }
        
        // Set the audio source with the correct URL
        set({ 
          currentSource: { ...source, source: audioUrl },
          currentTime: 0,
          duration: source.duration || 0,
          regions: [],
          selectedRegions: [],
          envelopePoints: [],
        });
        
        log.info('Audio source loaded successfully', { 
          name: source.name, 
          duration: source.duration,
          url: audioUrl
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load audio';
        log.error('Failed to load audio', error instanceof Error ? error : new Error(String(error)));
        set({ error: errorMessage });
      } finally {
        set({ isLoading: false });
      }
    },

    clearAudio: () => {
      logger.info('Clearing audio state');
      set({
        currentSource: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        regions: [],
        selectedRegions: [],
        envelopePoints: [],
        error: null,
      });
    },

    setError: (error: string | null) => {
      set({ error });
      if (error) {
        logger.error('Audio store error', new Error(error));
      }
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    setReady: (isReady: boolean) => {
      set({ isReady });
    },

    // Wavesurfer instance
    setWavesurfer: (wavesurfer) => set({ wavesurfer }),

    // Playback actions
    play: () => {
      logger.info('Play requested from store');
      get().wavesurfer?.play();
    },

    pause: () => {
      logger.info('Pause requested from store');
      get().wavesurfer?.pause();
    },

    seek: (time: number) => {
      const { duration } = get();
      const clampedTime = Math.max(0, Math.min(time, duration));
      set({ currentTime: clampedTime });
    },

    setVolume: (volume: number) => {
      const clampedVolume = Math.max(0, Math.min(volume, 1));
      set({ volume: clampedVolume });
    },

    setSpeed: (speed: number) => {
      const clampedSpeed = Math.max(0.25, Math.min(speed, 4));
      set({ speed: clampedSpeed });
    },

    setIsPlaying: (isPlaying) => {
      set({ isPlaying });
    },

    // Region actions
    addRegion: (region) => {
      logger.info('Adding region', { region });
      // Prevent adding duplicates
      set((state) => {
        if (state.regions.some((r) => r.id === region.id)) {
          return state;
        }
        return { regions: [...state.regions, region] };
      });
    },

    updateRegion: (id: string, updates: Partial<AudioRegion>) => {
      logger.debug('Updating region', { id, updates });
      set(state => ({
        regions: state.regions.map(region =>
          region.id === id ? { ...region, ...updates } : region
        ),
      }));
    },

    removeRegion: (id: string) => {
      logger.info('Removing region', { id });
      set(state => ({
        regions: state.regions.filter(region => region.id !== id),
        selectedRegions: state.selectedRegions.filter(selectedId => selectedId !== id),
      }));
    },

    selectRegion: (id: string, selected = true) => {
      set(state => ({
        selectedRegions: selected
          ? [...state.selectedRegions, id]
          : state.selectedRegions.filter(selectedId => selectedId !== id),
      }));
    },

    clearRegions: () => {
      logger.info('Clearing all regions');
      set({ regions: [], selectedRegions: [] });
    },

    // Profile actions
    addProfile: (profileData) => {
      const profile: AudioProfile = {
        id: generateId(),
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      logger.info('Adding profile', { profile: profile.name });
      set(state => ({ profiles: [...state.profiles, profile] }));
    },

    updateProfile: (id: string, updates: Partial<AudioProfile>) => {
      logger.debug('Updating profile', { id, updates });
      set(state => ({
        profiles: state.profiles.map(profile =>
          profile.id === id 
            ? { ...profile, ...updates, updatedAt: new Date() }
            : profile
        ),
      }));
    },

    removeProfile: (id: string) => {
      logger.info('Removing profile', { id });
      set(state => ({
        profiles: state.profiles.filter(profile => profile.id !== id),
      }));
    },

    // Envelope actions
    addEnvelopePoint: (point: EnvelopePoint) => {
      logger.debug('Adding envelope point', { point });
      set(state => ({ envelopePoints: [...state.envelopePoints, point] }));
    },

    updateEnvelopePoint: (index: number, point: EnvelopePoint) => {
      logger.debug('Updating envelope point', { index, point });
      set(state => ({
        envelopePoints: state.envelopePoints.map((p, i) => i === index ? point : p),
      }));
    },

    removeEnvelopePoint: (index: number) => {
      logger.debug('Removing envelope point', { index });
      set(state => ({
        envelopePoints: state.envelopePoints.filter((_, i) => i !== index),
      }));
    },

    clearEnvelope: () => {
      logger.info('Clearing envelope');
      set({ envelopePoints: [] });
    },

    // Session actions
    saveSession: (name: string) => {
      const state = get();
      if (!state.currentSource) {
        set({ error: 'No audio loaded to save session' });
        return;
      }

      const session: AudioSession = {
        id: generateId(),
        name,
        audioSource: state.currentSource,
        analysis: {
          id: generateId(),
          audioSourceId: state.currentSource.id,
          regions: state.regions,
          profiles: state.profiles,
          analysisDate: new Date(),
          version: '1.0.0',
        },
        playbackSettings: {
          volume: state.volume,
          speed: state.speed,
          selectedRegions: state.selectedRegions,
          loopEnabled: false,
          envelopePoints: state.envelopePoints,
        },
        regions: state.regions,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      logger.info('Saving session', { name, sessionId: session.id });
      set(state => ({ 
        sessions: [...state.sessions, session],
        currentSession: session,
      }));
    },

    loadSession: (sessionId: string) => {
      const state = get();
      const session = state.sessions.find(s => s.id === sessionId);
      
      if (!session) {
        set({ error: 'Session not found' });
        return;
      }

      logger.info('Loading session', { sessionId, name: session.name });
      set({
        currentSource: session.audioSource,
        regions: session.regions,
        profiles: session.analysis.profiles,
        selectedRegions: session.playbackSettings.selectedRegions,
        volume: session.playbackSettings.volume,
        speed: session.playbackSettings.speed,
        envelopePoints: session.playbackSettings.envelopePoints,
        currentSession: session,
        duration: session.audioSource.duration,
        currentTime: 0,
        error: null,
      });
    },

    deleteSession: (sessionId: string) => {
      logger.info('Deleting session', { sessionId });
      set(state => ({
        sessions: state.sessions.filter(s => s.id !== sessionId),
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
      }));
    },

    exportSession: (sessionId: string) => {
      const state = get();
      const session = state.sessions.find(s => s.id === sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      return JSON.stringify(session, null, 2);
    },

    importSession: (sessionData: string) => {
      try {
        const session: AudioSession = JSON.parse(sessionData);
        logger.info('Importing session', { name: session.name });
        set(state => ({ sessions: [...state.sessions, session] }));
      } catch (error) {
        logger.error('Failed to import session', error as Error);
        set({ error: 'Invalid session data' });
      }
    },
  }))
);

// Persist sessions to localStorage
useAudioStore.subscribe(
  (state) => state.sessions,
  (sessions) => {
    setToStorage('waverider_sessions', sessions);
  }
);

// Load sessions from localStorage on init
const savedSessions = getFromStorage<AudioSession[]>('waverider_sessions', []);
if (savedSessions.length > 0) {
  useAudioStore.setState({ sessions: savedSessions });
} 