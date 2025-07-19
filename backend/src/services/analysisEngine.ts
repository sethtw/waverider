/**
 * Core Analysis Engine for audio processing
 * @module services/analysisEngine
 */

import { logger } from '../utils/logger.ts';
import fftjs from 'fft-js';
import { v4 as uuidv4 } from 'uuid';
import type { AudioAnalysis, AudioProfile, AudioRegion } from '../types.ts';

class AnalysisEngine {
  private logger;

  constructor() {
    this.logger = logger.child({ service: 'analysisEngine' });
  }

  /**
   * Analyze audio data using various algorithms
   * @param {Float32Array} audioData - Raw audio samples
   * @param {Object} options - Analysis options
   * @returns {Object} Analysis results
   */
  async analyzeAudio(audioData: Float32Array, options: Record<string, any> = {}): Promise<AudioAnalysis> {
    this.logger.info('Starting audio analysis', { 
      sampleCount: audioData.length,
      options 
    });

    try {
      const results: AudioAnalysis = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        sampleCount: audioData.length,
        analysis: {
          amplitude: this.analyzeAmplitude(audioData, options),
          spectral: this.analyzeSpectral(audioData, options),
          patterns: this.detectPatterns(audioData, options),
          regions: this.detectRegions(audioData, options)
        }
      };

      this.logger.info('Analysis completed successfully', { 
        resultId: results.id 
      });

      return results;
    } catch (error: any) {
      this.logger.error('Analysis failed', error);
      throw new Error(`Analysis failed: ${error.message as string}`);
    }
  }

  /**
   * Analyze amplitude characteristics
   * @param {Float32Array} audioData - Raw audio samples
   * @param {Object} options - Analysis options
   * @returns {Object} Amplitude analysis results
   */
  analyzeAmplitude(audioData: Float32Array, options: Record<string, any> = {}): Record<string, number> {
    const { windowSize = 1024 } = options;
    
    const results = {
      rms: 0,
      peak: 0,
      average: 0,
      dynamicRange: 0,
      crestFactor: 0,
      zeroCrossings: 0
    };

    // Calculate basic statistics
    let sum = 0;
    let sumSquares = 0;
    let peak = 0;
    let zeroCrossings = 0;

    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.abs(audioData[i]);
      sum += sample;
      sumSquares += sample * sample;
      peak = Math.max(peak, sample);
      
      // Count zero crossings
      if (i > 0 && (audioData[i] >= 0) !== (audioData[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }

    results.average = sum / audioData.length;
    results.rms = Math.sqrt(sumSquares / audioData.length);
    results.peak = peak;
    results.dynamicRange = peak > 0 ? 20 * Math.log10(peak / results.rms) : 0;
    results.crestFactor = peak > 0 ? peak / results.rms : 0;
    results.zeroCrossings = zeroCrossings;

    return results;
  }

  /**
   * Perform spectral analysis using FFT
   * @param {Float32Array} audioData - Raw audio samples
   * @param {Object} options - Analysis options
   * @returns {Object} Spectral analysis results
   */
  analyzeSpectral(audioData: Float32Array, options: Record<string, any> = {}): Record<string, any> {
    const { fftSize = 2048, sampleRate = 44100 } = options;
    
    const results = {
      spectralCentroid: 0,
      spectralRolloff: 0,
      spectralFlux: 0,
      dominantFrequencies: [] as { frequency: number; magnitude: number }[],
      frequencyBands: {}
    };

    // Apply window function and perform FFT
    const windowedData = this.applyWindow(audioData.slice(0, fftSize));
    const fftResult: number[][] = fftjs.fft(windowedData);
    const magnitudes: number[] = fftResult.map((complex: number[]) => Math.sqrt(complex[0] * complex[0] + complex[1] * complex[1]));

    // Calculate spectral centroid
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < magnitudes.length; i++) {
      const frequency = (i * sampleRate) / fftSize;
      const magnitude = magnitudes[i];
      
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    results.spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;

    // Calculate frequency bands (bass, mid, treble)
    const bassEnd = Math.floor(fftSize * 250 / sampleRate);
    const midEnd = Math.floor(fftSize * 4000 / sampleRate);
    
    results.frequencyBands = {
      bass: this.calculateBandEnergy(magnitudes, 0, bassEnd),
      mid: this.calculateBandEnergy(magnitudes, bassEnd, midEnd),
      treble: this.calculateBandEnergy(magnitudes, midEnd, magnitudes.length / 2)
    };

    // Find dominant frequencies
    results.dominantFrequencies = this.findDominantFrequencies(magnitudes, sampleRate, fftSize);

    return results;
  }

  /**
   * Detect patterns in audio data
   * @param {Float32Array} audioData - Raw audio samples
   * @param {Object} options - Analysis options
   * @returns {Object} Pattern detection results
   */
  detectPatterns(audioData: Float32Array, options: Record<string, any> = {}): Record<string, any[]> {
    const { threshold = 0.1, minDuration = 0.1 } = options;
    
    const patterns: Record<string, any[]> = {
      quietSections: [],
      loudSections: [],
      transitions: [],
      repetitivePatterns: []
    };

    const sampleRate = options.sampleRate || 44100;
    const windowSize = Math.floor(minDuration * sampleRate);
    
    // Detect quiet and loud sections
    for (let i = 0; i < audioData.length - windowSize; i += windowSize) {
      const window = audioData.slice(i, i + windowSize);
      const rms = this.calculateRMS(window);
      
      if (rms < threshold) {
        patterns.quietSections.push({
          start: i / sampleRate,
          end: (i + windowSize) / sampleRate,
          rms: rms
        });
      } else if (rms > 0.7) {
        patterns.loudSections.push({
          start: i / sampleRate,
          end: (i + windowSize) / sampleRate,
          rms: rms
        });
      }
    }

    // Detect transitions
    patterns.transitions = this.detectTransitions(audioData, sampleRate as number, threshold as number);

    return patterns;
  }

  /**
   * Detect regions based on analysis profiles
   * @param {Float32Array} audioData - Raw audio samples
   * @param {Object} options - Analysis options
   * @returns {Array} Detected regions
   */
  detectRegions(audioData: Float32Array, options: Record<string, any> = {}): AudioRegion[] {
    const { profiles = [], sampleRate = 44100 } = options;
    const regions: AudioRegion[] = [];

    for (const profile of profiles) {
      const profileRegions = this.applyProfile(audioData, profile, sampleRate);
      regions.push(...profileRegions);
    }

    return regions;
  }

  /**
   * Apply a specific analysis profile to audio data
   * @param {Float32Array} audioData - Raw audio samples
   * @param {Object} profile - Analysis profile
   * @param {number} sampleRate - Audio sample rate
   * @returns {Array} Regions matching the profile
   */
  applyProfile(audioData: Float32Array, profile: AudioProfile, sampleRate: number): AudioRegion[] {
    const regions: AudioRegion[] = [];
    const windowSize = Math.floor((profile.parameters.windowSize || 1.0) * sampleRate);
    
    for (let i = 0; i < audioData.length - windowSize; i += windowSize) {
      const window = audioData.slice(i, i + windowSize);
      const analysis = this.analyzeAmplitude(window);
      
      let matches = false;
      
      switch (profile.type) {
        case 'quiet':
          matches = analysis.rms < (profile.parameters.maxAmplitude || 0.1);
          break;
        case 'intensity':
          matches = analysis.rms > (profile.parameters.minAmplitude || 0.7);
          break;
        case 'transition':
          // More complex transition detection
          matches = this.detectTransition(window, profile.parameters);
          break;
        default:
          matches = false;
      }
      
      if (matches) {
        regions.push({
          id: uuidv4(),
          start: i / sampleRate,
          end: (i + windowSize) / sampleRate,
          profile: profile.id,
          confidence: this.calculateConfidence(analysis, profile),
          data: analysis
        });
      }
    }
    
    return regions;
  }

  // Helper methods
  applyWindow(data: Float32Array): Float32Array {
    // Apply Hanning window
    const windowed = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const windowValue = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (data.length - 1)));
      windowed[i] = data[i] * windowValue;
    }
    return windowed;
  }

  calculateRMS(data: Float32Array): number {
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      sumSquares += data[i] * data[i];
    }
    return Math.sqrt(sumSquares / data.length);
  }

  calculateBandEnergy(magnitudes: number[], start: number, end: number): number {
    let energy = 0;
    for (let i = start; i < end; i++) {
      energy += magnitudes[i] * magnitudes[i];
    }
    return energy;
  }

  findDominantFrequencies(magnitudes: number[], sampleRate: number, fftSize: number): { frequency: number; magnitude: number }[] {
    const frequencies: { frequency: number; magnitude: number }[] = [];
    const threshold = Math.max(...magnitudes) * 0.1;
    
    for (let i = 0; i < magnitudes.length / 2; i++) {
      if (magnitudes[i] > threshold) {
        frequencies.push({
          frequency: (i * sampleRate) / fftSize,
          magnitude: magnitudes[i]
        });
      }
    }
    
    return frequencies
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, 5);
  }

  detectTransitions(audioData: Float32Array, sampleRate: number, threshold: number): { time: number; change: number; direction: string }[] {
    const transitions: { time: number; change: number; direction: string }[] = [];
    const windowSize = Math.floor(0.1 * sampleRate); // 100ms windows
    
    for (let i = windowSize; i < audioData.length - windowSize; i += windowSize) {
      const before = this.calculateRMS(audioData.slice(i - windowSize, i));
      const after = this.calculateRMS(audioData.slice(i, i + windowSize));
      
      const change = Math.abs(after - before);
      if (change > threshold) {
        transitions.push({
          time: i / sampleRate,
          change: change,
          direction: after > before ? 'increasing' : 'decreasing'
        });
      }
    }
    
    return transitions;
  }

  detectTransition(window: Float32Array, parameters: Record<string, any>): boolean {
    // Simple transition detection based on variance
    const variance = this.calculateVariance(window);
    return variance > (parameters.sensitivity || 0.5);
  }

  calculateVariance(data: Float32Array): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return variance;
  }

  calculateConfidence(analysis: Record<string, number>, profile: AudioProfile): number {
    // Calculate confidence based on how well the analysis matches the profile
    let confidence = 0;
    
    switch (profile.type) {
      case 'quiet':
        confidence = Math.max(0, 1 - (analysis.rms / (profile.parameters.maxAmplitude || 0.1)));
        break;
      case 'intensity':
        confidence = Math.min(1, analysis.rms / (profile.parameters.minAmplitude || 0.7));
        break;
      default:
        confidence = 0.5;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }
}

export const analysisEngine = new AnalysisEngine(); 