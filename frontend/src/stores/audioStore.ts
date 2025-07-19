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

  // Region playback state
  regionPlayback: {
    isPlaying: boolean;
    isLooping: boolean;
    queue: string[]; // Array of region IDs
    currentRegionId: string | null;
  };

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
  removeSelectedRegions: () => void;
  selectRegion: (id: string, selected?: boolean) => void;
  clearRegions: () => void;
  playSelectedRegions: () => void;
  pauseRegionPlayback: () => void;
  toggleLoop: () => void;
  exportRegions: () => string;
  importRegions: (regionsData: string) => void;
  
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
    
    // Region playback state
    regionPlayback: {
      isPlaying: false,
      isLooping: true,
      queue: [],
      currentRegionId: null,
    },

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

    removeSelectedRegions: () => {
      logger.info('Removing selected regions');
      set(state => ({
        regions: state.regions.filter(region => !state.selectedRegions.includes(region.id)),
        selectedRegions: [],
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

    playSelectedRegions: () => {
      const { wavesurfer, regions, selectedRegions, currentTime, regionPlayback } = get();
      if (!wavesurfer) return;

      if (selectedRegions.length === 0) {
        if (regionPlayback.isPlaying) {
          get().pauseRegionPlayback();
        }
        return;
      }

      const sortedSelectedRegions = [...selectedRegions]
        .map(id => regions.find(r => r.id === id)!)
        .filter(Boolean)
        .sort((a, b) => a.start - b.start);

      const wasPlaying = regionPlayback.isPlaying;
      const previousRegionId = regionPlayback.currentRegionId;
      const queue = sortedSelectedRegions.map(r => r.id);

      // 1. Find the region the playhead is currently inside
      const regionAtPlayhead = sortedSelectedRegions.find(
        r => currentTime >= r.start && currentTime < r.end
      );

      let regionToPlay: (typeof sortedSelectedRegions)[0];
      let startTime: number;

      if (regionAtPlayhead) {
        // 2. If playhead is in a region, play from there
        regionToPlay = regionAtPlayhead;
        startTime = currentTime;
      } else {
        // 3. If not, find the next region after the playhead
        const nextRegion = sortedSelectedRegions.find(r => r.start > currentTime);
        if (nextRegion) {
          regionToPlay = nextRegion;
          startTime = nextRegion.start;
        } else {
          // 4. If no next region, wrap around to the first one
          regionToPlay = sortedSelectedRegions[0];
          startTime = regionToPlay.start;
        }
      }

      set(state => ({
        regionPlayback: {
          ...state.regionPlayback,
          isPlaying: true,
          queue: queue,
          currentRegionId: regionToPlay.id,
        },
      }));

      // Only seek if we were paused or if the region has changed
      if (!wasPlaying || previousRegionId !== regionToPlay.id) {
        wavesurfer.setTime(startTime);
      }
      
      wavesurfer.play();
    },

    pauseRegionPlayback: () => {
      get().wavesurfer?.pause();
      set(state => ({
        regionPlayback: {
          ...state.regionPlayback,
          isPlaying: false,
        },
      }));
    },

    toggleLoop: () => {
      set(state => ({
        regionPlayback: {
          ...state.regionPlayback,
          isLooping: !state.regionPlayback.isLooping,
        }
      }));
    },

    exportRegions: () => {
      const { regions } = get();
      return JSON.stringify(regions, null, 2);
    },

    importRegions: (regionsData: string) => {
      try {
        const regions = JSON.parse(regionsData);
        // TODO: Add validation for the imported data
        set({ regions });
      } catch (error) {
        logger.error('Failed to import regions', error as Error);
        set({ error: 'Invalid regions data' });
      }
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
          analysis: {
            amplitude: {},
            spectral: {},
            patterns: {},
            regions: state.regions,
          },
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

useAudioStore.subscribe(
  (state) => state.wavesurfer,
  (wavesurfer) => {
    if (!wavesurfer) return;

    const subscription = wavesurfer.on('audioprocess', (currentTime) => {
      const { regionPlayback, regions, playSelectedRegions, pauseRegionPlayback, setSpeed } = useAudioStore.getState();
      
      if (!regionPlayback.isPlaying || !regionPlayback.currentRegionId) {
        return;
      }

      const currentRegion = regions.find(r => r.id === regionPlayback.currentRegionId);

      if (currentRegion && currentTime >= currentRegion.end) {
        const { queue, isLooping } = regionPlayback;
        const currentIndex = queue.indexOf(currentRegion.id);
        const nextIndex = currentIndex + 1;

        if (nextIndex < queue.length) {
          const nextRegionId = queue[nextIndex];
          const nextRegion = regions.find(r => r.id === nextRegionId)!;
          useAudioStore.setState(state => ({
            regionPlayback: { ...state.regionPlayback, currentRegionId: nextRegionId }
          }));
          wavesurfer.setTime(nextRegion.start);
          wavesurfer.play();
        } else {
          if (isLooping) {
            const firstRegionId = queue[0];
            const firstRegion = regions.find(r => r.id === firstRegionId)!;
            useAudioStore.setState(state => ({
              regionPlayback: { ...state.regionPlayback, currentRegionId: firstRegionId }
            }));
            wavesurfer.setTime(firstRegion.start);
            wavesurfer.play();
          } else {
            pauseRegionPlayback(); 
          }
        }
      }
    });

    return () => {
      subscription();
    };
  }
);

useAudioStore.subscribe(
  (state) => state.selectedRegions,
  (selectedRegions, previousSelectedRegions) => {
    const { regionPlayback, playSelectedRegions, pauseRegionPlayback } = useAudioStore.getState();
    if (regionPlayback.isPlaying) {
      if (selectedRegions.length === 0) {
        pauseRegionPlayback();
      } else {
        playSelectedRegions();
      }
    }
  }
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