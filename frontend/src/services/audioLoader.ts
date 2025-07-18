/**
 * Audio loading service for Waverider
 * @module services/audioLoader
 */

import { logger } from '../utils/logger';
import type { AudioSource, AudioMetadata } from '../types';
import { generateId, isValidUrl, isValidAudioFile } from '../utils';

export interface AudioLoadOptions {
  type: 'file' | 'url' | 'youtube';
  source: string;
  name?: string;
}

export interface AudioLoadResult {
  success: boolean;
  source?: AudioSource;
  error?: string;
}

/**
 * Audio loading service
 */
export class AudioLoader {
  private static instance: AudioLoader;
  private audioContext: AudioContext | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): AudioLoader {
    if (!AudioLoader.instance) {
      AudioLoader.instance = new AudioLoader();
    }
    return AudioLoader.instance;
  }

  /**
   * Initialize audio context
   */
  private async initAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Load audio from various sources
   */
  async loadAudio(options: AudioLoadOptions): Promise<AudioLoadResult> {
    const log = logger.child('audioLoader');
    log.info('Loading audio', { type: options.type, source: options.source });

    try {
      let source: AudioSource;

      switch (options.type) {
        case 'file':
          source = await this.loadFromFile(options.source, options.name);
          break;
        case 'url':
          source = await this.loadFromUrl(options.source, options.name);
          break;
        case 'youtube':
          source = await this.loadFromYouTube(options.source, options.name);
          break;
        default:
          throw new Error(`Unsupported audio source type: ${options.type}`);
      }

      log.info('Audio loaded successfully', { 
        name: source.name, 
        duration: source.duration 
      });

      return { success: true, source };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audio';
      log.error('Failed to load audio', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Load audio from local file
   */
  private async loadFromFile(filePath: string, name?: string): Promise<AudioSource> {
    const log = logger.child('audioLoader.file');
    
    // For now, we'll simulate file loading
    // In a real implementation, you'd need to handle file system access
    const fileName = name || filePath.split('/').pop() || 'Unknown File';
    
    if (!isValidAudioFile(fileName)) {
      throw new Error('Invalid audio file format');
    }

    // Simulate audio metadata extraction
    const metadata: AudioMetadata = {
      title: fileName,
      format: fileName.split('.').pop()?.toLowerCase(),
    };

    const source: AudioSource = {
      id: generateId(),
      name: fileName,
      type: 'file',
      source: filePath,
      duration: 0, // Will be set when audio is actually loaded
      sampleRate: 44100,
      channels: 2,
      loadedAt: new Date(),
      metadata,
    };

    log.info('File source created', { fileName });
    return source;
  }

  /**
   * Load audio from URL
   */
  private async loadFromUrl(url: string, name?: string): Promise<AudioSource> {
    const log = logger.child('audioLoader.url');
    
    if (!isValidUrl(url)) {
      throw new Error('Invalid URL format');
    }

    // Validate that the URL points to an audio file
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    if (!isValidAudioFile(fileName)) {
      throw new Error('URL does not point to a valid audio file');
    }

    // Simulate fetching audio metadata
    const metadata: AudioMetadata = {
      title: name || fileName,
      format: fileName.split('.').pop()?.toLowerCase(),
    };

    const source: AudioSource = {
      id: generateId(),
      name: name || fileName,
      type: 'url',
      source: url,
      duration: 0, // Will be set when audio is actually loaded
      sampleRate: 44100,
      channels: 2,
      loadedAt: new Date(),
      metadata,
    };

    log.info('URL source created', { url, fileName });
    return source;
  }

  /**
   * Load audio from YouTube
   */
  private async loadFromYouTube(url: string, name?: string): Promise<AudioSource> {
    const log = logger.child('audioLoader.youtube');
    
    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(url)) {
      throw new Error('Invalid YouTube URL');
    }

    // Extract video ID
    const videoId = this.extractYouTubeVideoId(url);
    if (!videoId) {
      throw new Error('Could not extract YouTube video ID');
    }

    // Simulate YouTube metadata extraction
    const metadata: AudioMetadata = {
      title: name || `YouTube Video (${videoId})`,
      format: 'mp4', // YouTube typically provides MP4
    };

    const source: AudioSource = {
      id: generateId(),
      name: name || `YouTube Video (${videoId})`,
      type: 'youtube',
      source: url,
      duration: 0, // Will be set when audio is actually loaded
      sampleRate: 44100,
      channels: 2,
      loadedAt: new Date(),
      metadata,
    };

    log.info('YouTube source created', { videoId, url });
    return source;
  }

  /**
   * Extract YouTube video ID from URL
   */
  private extractYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Get audio duration from ArrayBuffer
   */
  async getAudioDuration(audioBuffer: ArrayBuffer): Promise<number> {
    try {
      const audioContext = await this.initAudioContext();
      const buffer = await audioContext.decodeAudioData(audioBuffer);
      return buffer.duration;
    } catch (error) {
      logger.error('Failed to get audio duration', error instanceof Error ? error : new Error(String(error)));
      return 0;
    }
  }

  /**
   * Fetch audio data from URL
   */
  async fetchAudioData(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`);
    }

    return await response.arrayBuffer();
  }

  /**
   * Validate audio file format
   */
  validateAudioFormat(buffer: ArrayBuffer): boolean {
    // Basic validation - check for common audio file headers
    const view = new Uint8Array(buffer);
    
    // Check for MP3 header
    if (view[0] === 0x49 && view[1] === 0x44 && view[2] === 0x33) {
      return true;
    }
    
    // Check for WAV header
    if (view[0] === 0x52 && view[1] === 0x49 && view[2] === 0x46 && view[3] === 0x46) {
      return true;
    }
    
    // Check for OGG header
    if (view[0] === 0x4F && view[1] === 0x67 && view[2] === 0x67 && view[3] === 0x53) {
      return true;
    }

    return false;
  }

  /**
   * Extract audio metadata from buffer
   */
  async extractMetadata(buffer: ArrayBuffer): Promise<AudioMetadata> {
    // This is a simplified implementation
    // In a real app, you'd use libraries like music-metadata
    const metadata: AudioMetadata = {
      format: 'unknown',
      bitrate: 0,
    };

    try {
      const audioContext = await this.initAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(buffer);
      
      metadata.format = 'decoded';
      // Calculate approximate bitrate
      const duration = audioBuffer.duration;
      const size = buffer.byteLength;
      metadata.bitrate = Math.round((size * 8) / duration);
      
    } catch (error) {
      logger.warn('Failed to extract metadata', { error });
    }

    return metadata;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export singleton instance
export const audioLoader = AudioLoader.getInstance(); 