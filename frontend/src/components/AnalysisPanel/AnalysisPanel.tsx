/**
 * Analysis Panel Component
 * @module components/AnalysisPanel
 */

import React, { useState, useEffect } from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { analysisService } from '../../services/analysisService';
import { logger } from '../../utils/logger';
import type { AudioAnalysis, AudioProfile, AudioRegion } from '../../types';

interface AnalysisPanelProps {
  className?: string;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ className = '' }) => {
  const { currentSource, wavesurfer } = useAudioStore();
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [profiles, setProfiles] = useState<AudioProfile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const log = logger.child('AnalysisPanel');

  // Load profiles on component mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const loadedProfiles = await analysisService.getProfiles();
      setProfiles(loadedProfiles);
      log.info('Profiles loaded', { count: loadedProfiles.length });
    } catch (error) {
      log.error('Failed to load profiles', error instanceof Error ? error : new Error(String(error)));
      setError('Failed to load analysis profiles');
    }
  };

  const handleAnalyze = async () => {
    if (!currentSource || !wavesurfer) {
      setError('No audio loaded for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      log.info('Starting analysis', { sourceName: currentSource.name });

      // Get audio data from wavesurfer
      const audioBuffer = wavesurfer.getDecodedData();
      if (!audioBuffer) {
        throw new Error('No audio data available for analysis');
      }

      // Convert AudioBuffer to Float32Array
      const audioData = audioBuffer.getChannelData(0); // Use first channel

      // Perform analysis
      const analysisResult = await analysisService.analyzeAudio(audioData, {
        sampleRate: currentSource.sampleRate,
        profiles: profiles.filter(p => selectedProfiles.includes(p.id))
      });

      setAnalysis(analysisResult);
      setAnalysisResults(analysisResult);
      
      log.info('Analysis completed', { resultId: analysisResult.id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      log.error('Analysis failed', error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProfileToggle = (profileId: string) => {
    setSelectedProfiles(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleDetectRegions = async () => {
    if (!currentSource || !wavesurfer || selectedProfiles.length === 0) {
      setError('Please select at least one profile for region detection');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const audioBuffer = wavesurfer.getDecodedData();
      if (!audioBuffer) {
        throw new Error('No audio data available');
      }

      // Convert AudioBuffer to Float32Array
      const audioData = audioBuffer.getChannelData(0); // Use first channel

      const selectedProfileObjects = profiles.filter(p => selectedProfiles.includes(p.id));
      const regions = await analysisService.detectRegions(audioData, selectedProfileObjects, {
        sampleRate: currentSource.sampleRate
      });

      // Add regions to the store
      regions.forEach(region => {
        // TODO: Add regions to wavesurfer and store
        log.info('Region detected', { region });
      });

      log.info('Region detection completed', { count: regions.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Region detection failed';
      log.error('Region detection failed', error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatAnalysisValue = (value: number, unit: string = '') => {
    if (typeof value === 'number') {
      return `${value.toFixed(2)}${unit}`;
    }
    return String(value);
  };

  if (!currentSource) {
    return (
      <div className={`panel ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
        <div className="text-center text-gray-400 py-8">
          Load an audio file to enable analysis
        </div>
      </div>
    );
  }

  return (
    <div className={`panel ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
      
      {/* Analysis Controls */}
      <div className="mb-6 space-y-4">
        <div>
          <h4 className="text-md font-medium mb-2">Analysis Profiles</h4>
          <div className="space-y-2">
            {profiles.map(profile => (
              <label key={profile.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedProfiles.includes(profile.id)}
                  onChange={() => handleProfileToggle(profile.id)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500"
                />
                <span className="text-sm">
                  {profile.name}
                  <span className="text-gray-400 ml-1">({profile.type})</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="btn-primary flex-1"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Audio'}
          </button>
          <button
            onClick={handleDetectRegions}
            disabled={isAnalyzing || selectedProfiles.length === 0}
            className="btn-secondary flex-1"
          >
            Detect Regions
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <div className="space-y-4">
          <h4 className="text-md font-medium">Analysis Results</h4>
          
          {/* Amplitude Analysis */}
          {analysisResults.amplitude && (
            <div className="bg-gray-800 p-3 rounded">
              <h5 className="text-sm font-medium mb-2">Amplitude Analysis</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>RMS: {formatAnalysisValue(analysisResults.amplitude.rms)}</div>
                <div>Peak: {formatAnalysisValue(analysisResults.amplitude.peak)}</div>
                <div>Average: {formatAnalysisValue(analysisResults.amplitude.average)}</div>
                <div>Dynamic Range: {formatAnalysisValue(analysisResults.amplitude.dynamicRange, 'dB')}</div>
                <div>Crest Factor: {formatAnalysisValue(analysisResults.amplitude.crestFactor)}</div>
                <div>Zero Crossings: {analysisResults.amplitude.zeroCrossings}</div>
              </div>
            </div>
          )}

          {/* Spectral Analysis */}
          {analysisResults.spectral && (
            <div className="bg-gray-800 p-3 rounded">
              <h5 className="text-sm font-medium mb-2">Spectral Analysis</h5>
              <div className="space-y-2 text-sm">
                <div>Spectral Centroid: {formatAnalysisValue(analysisResults.spectral.spectralCentroid, 'Hz')}</div>
                
                {analysisResults.spectral.frequencyBands && (
                  <div>
                    <div className="font-medium mb-1">Frequency Bands:</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>Bass: {formatAnalysisValue(analysisResults.spectral.frequencyBands.bass)}</div>
                      <div>Mid: {formatAnalysisValue(analysisResults.spectral.frequencyBands.mid)}</div>
                      <div>Treble: {formatAnalysisValue(analysisResults.spectral.frequencyBands.treble)}</div>
                    </div>
                  </div>
                )}

                {analysisResults.spectral.dominantFrequencies && analysisResults.spectral.dominantFrequencies.length > 0 && (
                  <div>
                    <div className="font-medium mb-1">Dominant Frequencies:</div>
                    <div className="space-y-1">
                      {analysisResults.spectral.dominantFrequencies.slice(0, 3).map((freq: any, index: number) => (
                        <div key={index} className="text-xs">
                          {formatAnalysisValue(freq.frequency, 'Hz')} ({formatAnalysisValue(freq.magnitude)})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pattern Detection */}
          {analysisResults.patterns && (
            <div className="bg-gray-800 p-3 rounded">
              <h5 className="text-sm font-medium mb-2">Pattern Detection</h5>
              <div className="space-y-2 text-sm">
                <div>Quiet Sections: {analysisResults.patterns.quietSections?.length || 0}</div>
                <div>Loud Sections: {analysisResults.patterns.loudSections?.length || 0}</div>
                <div>Transitions: {analysisResults.patterns.transitions?.length || 0}</div>
              </div>
            </div>
          )}

          {/* Detected Regions */}
          {analysisResults.regions && analysisResults.regions.length > 0 && (
            <div className="bg-gray-800 p-3 rounded">
              <h5 className="text-sm font-medium mb-2">Detected Regions</h5>
              <div className="space-y-1 text-sm">
                {analysisResults.regions.slice(0, 5).map((region: AudioRegion) => (
                  <div key={region.id} className="flex justify-between">
                    <span>{region.start.toFixed(2)}s - {region.end.toFixed(2)}s</span>
                    <span className="text-gray-400">
                      {region.confidence ? `${(region.confidence * 100).toFixed(0)}%` : ''}
                    </span>
                  </div>
                ))}
                {analysisResults.regions.length > 5 && (
                  <div className="text-gray-400 text-xs">
                    +{analysisResults.regions.length - 5} more regions
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!analysisResults && !isAnalyzing && (
        <div className="text-center text-gray-400 py-8">
          Click "Analyze Audio" to start analysis
        </div>
      )}
    </div>
  );
}; 