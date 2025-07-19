/**
 * Analysis Panel Component
 * @module components/AnalysisPanel
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { analysisService } from '../../services/analysisService';
import { logger } from '../../utils/logger';
import type { AudioAnalysis, AudioProfile, AudioRegion } from '../../types';

interface AnalysisPanelProps {
  className?: string;
}

// Helper function to generate region colors based on confidence
const generateRegionColor = (confidence?: number): string => {
  if (!confidence) return 'rgba(59, 130, 246, 0.3)'; // Default blue
  
  // Generate color based on confidence: red (low) -> yellow (medium) -> green (high)
  if (confidence < 0.3) return 'rgba(239, 68, 68, 0.3)'; // Red for low confidence
  if (confidence < 0.7) return 'rgba(245, 158, 11, 0.3)'; // Orange for medium confidence
  return 'rgba(34, 197, 94, 0.3)'; // Green for high confidence
};

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ className = '' }) => {
  const { currentSource, wavesurfer, addRegion } = useAudioStore();
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [profiles, setProfiles] = useState<AudioProfile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importData, setImportData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setAnalysisProgress('Preparing audio data...');
    setError(null);

    try {
      log.info('Starting analysis', { sourceName: currentSource.name });

      // Get audio data from wavesurfer
      setAnalysisProgress('Extracting audio data...');
      const audioBuffer = wavesurfer.getDecodedData();
      if (!audioBuffer) {
        throw new Error('No audio data available for analysis');
      }

      // Convert AudioBuffer to Float32Array
      setAnalysisProgress('Processing audio samples...');
      const audioData = audioBuffer.getChannelData(0); // Use first channel

      // Perform analysis
      setAnalysisProgress('Running analysis algorithms...');
      const analysisResult = await analysisService.analyzeAudio(audioData, {
        sampleRate: currentSource.sampleRate,
        profiles: profiles.filter(p => selectedProfiles.includes(p.id))
      });

      setAnalysisProgress('Finalizing results...');
      setAnalysis(analysisResult);
      setAnalysisResults(analysisResult.analysis);
      
      log.info('Analysis completed', { resultId: analysisResult.id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      log.error('Analysis failed', error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress('');
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
    setAnalysisProgress('Preparing region detection...');
    setError(null);

    try {
      setAnalysisProgress('Extracting audio data...');
      const audioBuffer = wavesurfer.getDecodedData();
      if (!audioBuffer) {
        throw new Error('No audio data available');
      }

      // Convert AudioBuffer to Float32Array
      setAnalysisProgress('Processing audio samples...');
      const audioData = audioBuffer.getChannelData(0); // Use first channel

      const selectedProfileObjects = profiles.filter(p => selectedProfiles.includes(p.id));
      setAnalysisProgress(`Detecting regions with ${selectedProfileObjects.length} profile(s)...`);
      const regions = await analysisService.detectRegions(audioData, selectedProfileObjects, {
        sampleRate: currentSource.sampleRate
      });

      // Add regions to the store (WaveformViewer will automatically sync to wavesurfer)
      if (regions.length > 0) {
        setAnalysisProgress(`Adding ${regions.length} detected regions...`);
      }
      regions.forEach((region, index) => {
        const regionWithDefaults = {
          ...region,
          id: region.id || `detected-${Date.now()}-${index}`,
          label: region.label || `${selectedProfileObjects.find(p => p.id === region.profile)?.name || 'Detected'} Region`,
          color: region.color || generateRegionColor(region.confidence),
          data: {
            ...region.data,
            confidence: region.confidence,
            profile: region.profile,
            detectedAt: new Date().toISOString(),
          }
        };
        
        addRegion(regionWithDefaults);
        log.info('Region added to store', { region: regionWithDefaults });
      });

      log.info('Region detection completed', { count: regions.length });
      
      // Show success message to user
      if (regions.length > 0) {
        // This will be visible in the console/logs and the regions will appear on the waveform
        log.info(`Successfully added ${regions.length} regions to the waveform`);
      } else {
        log.info('No regions detected with the selected profiles');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Region detection failed';
      log.error('Region detection failed', error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  const formatAnalysisValue = (value: number, unit: string = '') => {
    if (typeof value === 'number') {
      return `${value.toFixed(2)}${unit}`;
    }
    return String(value);
  };

  const handleExportAnalysis = () => {
    if (!analysisResults) {
      setError('No analysis results to export');
      return;
    }

    try {
      const exportData = {
        analysis: analysisResults,
        exportedAt: new Date().toISOString(),
        audioSource: {
          name: currentSource?.name,
          duration: currentSource?.duration,
          sampleRate: currentSource?.sampleRate,
        },
        profiles: profiles.filter(p => selectedProfiles.includes(p.id)),
        version: '1.0.0',
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `waverider-analysis-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      log.info('Analysis exported successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export analysis';
      log.error('Failed to export analysis', error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage);
    }
  };

  const handleImportFromFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setImportData(content);
        setShowImportForm(true);
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleImportAnalysis = () => {
    try {
      const importedData = JSON.parse(importData);
      
      if (!importedData.analysis) {
        throw new Error('Invalid analysis data format');
      }

      setAnalysisResults(importedData.analysis);
      setAnalysis(importedData.analysis);
      
      // Optionally import regions if they exist
      if (importedData.analysis.regions) {
        importedData.analysis.regions.forEach((region: AudioRegion) => {
          addRegion(region);
        });
      }

      setShowImportForm(false);
      setImportData('');
      setError(null);
      
      log.info('Analysis imported successfully', { 
        analysisId: importedData.analysis.id,
        regionsCount: importedData.analysis.regions?.length || 0 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import analysis';
      log.error('Failed to import analysis', error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage);
    }
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Analysis Results</h3>
        <div className="flex space-x-1">
          <button
            onClick={handleExportAnalysis}
            disabled={!analysisResults || isAnalyzing}
            className="btn-secondary text-sm px-2 py-1"
            title="Export analysis results"
          >
            📤
          </button>
          <button
            onClick={handleImportFromFile}
            disabled={isAnalyzing}
            className="btn-secondary text-sm px-2 py-1"
            title="Import analysis results"
          >
            📁
          </button>
        </div>
      </div>
      
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
            {isAnalyzing ? 'Detecting...' : 'Detect Regions'}
          </button>
        </div>

        {isAnalyzing && analysisProgress && (
          <div className="text-blue-400 text-sm bg-blue-900/20 p-2 rounded flex items-center">
            <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full mr-2"></div>
            {analysisProgress}
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        {/* Import Analysis Form */}
        {showImportForm && (
          <div className="bg-gray-800 p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-3">Import Analysis</h4>
            <div className="space-y-3">
              <div>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste analysis JSON data here..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                  rows={6}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleImportAnalysis}
                  disabled={!importData.trim()}
                  className="btn-primary flex-1 text-sm"
                >
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowImportForm(false);
                    setImportData('');
                    setError(null);
                  }}
                  className="btn-secondary flex-1 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <div className="space-y-4">
          <h4 className="text-md font-medium">Analysis Results</h4>
          
          {/* Amplitude Analysis */}
          {analysisResults.amplitude && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h5 className="text-sm font-medium mb-3 flex items-center">
                📊 Amplitude Analysis
              </h5>
              <div className="space-y-3">
                {/* Visual amplitude meters */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span>RMS Level</span>
                    <span className="font-mono">{formatAnalysisValue(analysisResults.amplitude.rms)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(analysisResults.amplitude.rms * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span>Peak Level</span>
                    <span className="font-mono">{formatAnalysisValue(analysisResults.amplitude.peak)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(analysisResults.amplitude.peak * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Additional metrics in a grid */}
                <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-gray-700">
                  <div className="bg-gray-700/50 p-2 rounded">
                    <div className="text-xs text-gray-400">Average</div>
                    <div className="font-medium">{formatAnalysisValue(analysisResults.amplitude.average)}</div>
                  </div>
                  <div className="bg-gray-700/50 p-2 rounded">
                    <div className="text-xs text-gray-400">Dynamic Range</div>
                    <div className="font-medium">{formatAnalysisValue(analysisResults.amplitude.dynamicRange, 'dB')}</div>
                  </div>
                  <div className="bg-gray-700/50 p-2 rounded">
                    <div className="text-xs text-gray-400">Crest Factor</div>
                    <div className="font-medium">{formatAnalysisValue(analysisResults.amplitude.crestFactor)}</div>
                  </div>
                  <div className="bg-gray-700/50 p-2 rounded">
                    <div className="text-xs text-gray-400">Zero Crossings</div>
                    <div className="font-medium">{analysisResults.amplitude.zeroCrossings}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Spectral Analysis */}
          {analysisResults.spectral && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h5 className="text-sm font-medium mb-3 flex items-center">
                🎵 Spectral Analysis
              </h5>
              <div className="space-y-4">
                {/* Spectral Centroid */}
                <div className="bg-gray-700/50 p-3 rounded">
                  <div className="text-xs text-gray-400 mb-1">Spectral Centroid (Brightness)</div>
                  <div className="text-lg font-mono">{formatAnalysisValue(analysisResults.spectral.spectralCentroid, 'Hz')}</div>
                </div>

                {/* Frequency Bands with visual representation */}
                {analysisResults.spectral.frequencyBands && (
                  <div>
                    <div className="text-sm font-medium mb-2">Frequency Bands</div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center">
                            🔊 Bass (20-250Hz)
                          </span>
                          <span className="font-mono">{formatAnalysisValue(analysisResults.spectral.frequencyBands.bass)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(analysisResults.spectral.frequencyBands.bass * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center">
                            🔉 Mid (250-4kHz)
                          </span>
                          <span className="font-mono">{formatAnalysisValue(analysisResults.spectral.frequencyBands.mid)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(analysisResults.spectral.frequencyBands.mid * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center">
                            🔈 Treble (4-20kHz)
                          </span>
                          <span className="font-mono">{formatAnalysisValue(analysisResults.spectral.frequencyBands.treble)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(analysisResults.spectral.frequencyBands.treble * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
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
            <div className="bg-gray-800 p-4 rounded-lg">
              <h5 className="text-sm font-medium mb-3 flex items-center">
                🔍 Pattern Detection
              </h5>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-700/30 p-3 rounded text-center">
                  <div className="text-xs text-blue-300 mb-1">Quiet Sections</div>
                  <div className="text-lg font-bold">{analysisResults.patterns.quietSections?.length || 0}</div>
                </div>
                <div className="bg-red-700/30 p-3 rounded text-center">
                  <div className="text-xs text-red-300 mb-1">Loud Sections</div>
                  <div className="text-lg font-bold">{analysisResults.patterns.loudSections?.length || 0}</div>
                </div>
                <div className="bg-yellow-700/30 p-3 rounded text-center">
                  <div className="text-xs text-yellow-300 mb-1">Transitions</div>
                  <div className="text-lg font-bold">{analysisResults.patterns.transitions?.length || 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Detected Regions */}
          {analysisResults.regions && analysisResults.regions.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h5 className="text-sm font-medium mb-3 flex items-center justify-between">
                <span className="flex items-center">🎯 Detected Regions</span>
                <span className="text-xs bg-blue-700 px-2 py-1 rounded">
                  {analysisResults.regions.length} total
                </span>
              </h5>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {analysisResults.regions.slice(0, 8).map((region: AudioRegion, index: number) => (
                  <div key={region.id} className="bg-gray-700/50 p-2 rounded flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: region.color || generateRegionColor(region.confidence) }}
                      ></div>
                      <span className="text-sm font-mono">
                        {region.start.toFixed(2)}s - {region.end.toFixed(2)}s
                      </span>
                      <span className="text-xs text-gray-400">
                        ({((region.end - region.start) || 0).toFixed(2)}s)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {region.confidence && (
                        <div className="flex items-center space-x-1">
                          <div className="w-12 bg-gray-600 rounded-full h-1">
                            <div 
                              className="bg-green-400 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${region.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {(region.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {analysisResults.regions.length > 8 && (
                  <div className="text-center text-gray-400 text-xs py-2">
                    +{analysisResults.regions.length - 8} more regions (scroll in waveform to see all)
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

      {/* Hidden file input for importing */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />
    </div>
  );
}; 