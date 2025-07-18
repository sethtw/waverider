/**
 * Waveform viewer component using the useWavesurfer hook and Regions plugin
 * @module components/WaveformViewer
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import { logger } from '../../utils/logger';
import { useAudioStore } from '../../stores/audioStore';
import type { AudioRegion } from '../../types';
import { formatTime } from '../../utils';

interface WaveformViewerProps {
  className?: string;
  height?: number;
}

// Give regions a random color when they are created
const random = (min: number, max: number) => Math.random() * (max - min) + min;
const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`;

export function WaveformViewer({ className = '', height = 200 }: WaveformViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use selective state selectors to prevent re-renders on unrelated state changes
  const currentSource = useAudioStore((state) => state.currentSource);
  const storeRegions = useAudioStore((state) => state.regions);
  // Get actions once without subscribing, as they are static
  const { play, pause, seek, addRegion, updateRegion } = useAudioStore.getState();

  const [regionsPlugin] = useState(() => RegionsPlugin.create());
  const plugins = useMemo(() => [regionsPlugin], [regionsPlugin]);
  const isSyncing = useRef(false);
  const isPluginInitiated = useRef(false);

  // Set up RegionsPlugin event listeners
  useEffect(() => {
    if (!regionsPlugin) return;
    const log = logger.child('WaveformViewer');

    const unsubs = [
      regionsPlugin.on('region-created', (region) => {
        if (isSyncing.current) return;
        log.info('Region created by user', { id: region.id });
        isPluginInitiated.current = true;
        addRegion({
          id: region.id,
          start: region.start,
          end: region.end,
          color: region.color as string,
          data: (region as any).data,
        });
      }),
      regionsPlugin.on('region-updated', (region) => {
        if (isSyncing.current) return;
        log.info('Region updated by user', { id: region.id });
        isPluginInitiated.current = true;
        updateRegion(region.id, {
          start: region.start,
          end: region.end,
        });
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [regionsPlugin, addRegion, updateRegion]);
  
  const { wavesurfer, isReady, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    height,
    waveColor: '#4F46E5',
    progressColor: '#7C3AED',
    cursorColor: '#F59E0B',
    url: currentSource?.source,
    plugins: plugins,
    backend: 'WebAudio',
    interact: true,
  });

  // Enable drag selection when the plugin and wavesurfer are ready
  useEffect(() => {
    if (!regionsPlugin || !isReady) return;
    regionsPlugin.enableDragSelection({
      color: 'rgba(255, 0, 0, 0.1)',
    });
  }, [regionsPlugin, isReady]);

  // Sync store state with wavesurfer state
  useEffect(() => {
    if (isPlaying) {
      play();
    } else {
      pause();
    }
  }, [isPlaying, play, pause]);

  useEffect(() => {
    seek(currentTime);
  }, [currentTime, seek]);

  // Sync regions from store to plugin
  useEffect(() => {
    if (!regionsPlugin || !isReady) return;
    
    // If the last update was from the plugin, just reset the flag and skip sync
    if (isPluginInitiated.current) {
      isPluginInitiated.current = false;
      return;
    }

    const log = logger.child('WaveformViewer');
    log.info('Syncing regions from store to plugin');
    isSyncing.current = true;
    regionsPlugin.clearRegions();
    storeRegions.forEach(region => {
      regionsPlugin.addRegion({
        id: region.id,
        start: region.start,
        end: region.end,
        color: region.color || randomColor(),
        data: region.data,
      } as any);
    });

    // Use a timeout to ensure all 'region-created' events have fired
    // before we start listening again.
    setTimeout(() => {
        isSyncing.current = false;
    }, 100);
  }, [storeRegions, regionsPlugin, isReady]);

  // Temporary button to test adding regions
  const handleAddRegion = () => {
    if (!wavesurfer || !regionsPlugin) return;
    const duration = wavesurfer.getDuration();
    regionsPlugin.addRegion({
      start: duration / 4,
      end: duration / 2,
      content: 'Test Region',
      color: randomColor(),
    });
  };

  if (!currentSource) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-lg font-medium mb-2">No Audio Loaded</div>
          <div className="text-sm">Load an audio file to see the waveform</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div ref={containerRef} />
      <div className="text-sm text-gray-400">
        <div>Source: {currentSource.name}</div>
        <div>Duration: {isReady && wavesurfer ? formatTime(wavesurfer.getDuration()) : '00:00'}</div>
        <div>Regions: {storeRegions.length}</div>
      </div>
      <button onClick={handleAddRegion} className="btn-secondary">Add Test Region</button>
    </div>
  );
} 