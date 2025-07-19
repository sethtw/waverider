/**
 * RegionPanel component to display and manage audio regions.
 * @module components/RegionPanel
 */

import React, { useState } from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { logger } from '../../utils/logger';
import { formatTime } from '../../utils';
import { EditRegionModal } from '../modals/EditRegionModal';
import type { AudioRegion } from '../../types';

export function RegionPanel() {
  const regions = useAudioStore((state) => state.regions);
  const regionPlayback = useAudioStore((state) => state.regionPlayback);
  const isGlobalPlaying = useAudioStore((state) => state.isPlaying);
  const selectedRegions = useAudioStore((state) => state.selectedRegions);
  const {
    removeSelectedRegions,
    updateRegion,
    selectRegion,
    exportRegions,
    importRegions,
    playSelectedRegions,
    pauseRegionPlayback,
    toggleLoop,
    play,
    pause,
  } = useAudioStore.getState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<AudioRegion | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleEditRegion = (region: AudioRegion) => {
    setSelectedRegion(region);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRegion(null);
  };

  const handleSaveChanges = (updates: Partial<AudioRegion>) => {
    if (selectedRegion) {
      updateRegion(selectedRegion.id, updates);
    }
    handleCloseModal();
  };

  const isRegionSelected = (id: string) => selectedRegions.includes(id);

  const handleExport = () => {
    const regionsData = exportRegions();
    const blob = new Blob([regionsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'regions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          importRegions(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleGlobalPlayPause = () => {
    if (selectedRegions.length > 0) {
      if (regionPlayback.isPlaying) {
        pauseRegionPlayback();
      } else {
        playSelectedRegions();
      }
    } else {
      if (isGlobalPlaying) {
        pause();
      } else {
        play();
      }
    }
  };

  const isPlaybackActive = selectedRegions.length > 0 ? regionPlayback.isPlaying : isGlobalPlaying;

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Regions</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="loop-checkbox"
              checked={regionPlayback.isLooping}
              onChange={toggleLoop}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="loop-checkbox" className="ml-2 text-sm text-gray-300">
              Loop
            </label>
          </div>
          <button onClick={handleGlobalPlayPause} className="btn-primary">
            {isPlaybackActive ? '❚❚' : '▶'}
          </button>

          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="btn-secondary"
            >
              ⋮
            </button>
            {isMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10"
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    removeSelectedRegions();
                    setIsMenuOpen(false);
                  }}
                  disabled={selectedRegions.length === 0}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => {
                    triggerImport();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                >
                  Import Regions
                </button>
                <button
                  onClick={() => {
                    handleExport();
                    setIsMenuOpen(false);
                  }}
                  disabled={regions.length === 0}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                >
                  Export Regions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        className="hidden"
        accept=".json"
      />
      {regions.length === 0 ? (
        <p className="text-gray-400">No regions created yet.</p>
      ) : (
        <ul className="space-y-2">
          {regions.map((region) => (
            <li
              key={region.id}
              className={`p-3 rounded-md flex justify-between items-center transition-colors ${
                regionPlayback.currentRegionId === region.id
                  ? 'bg-indigo-600'
                  : isRegionSelected(region.id)
                  ? 'bg-blue-600'
                  : 'bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isRegionSelected(region.id)}
                  onChange={() => selectRegion(region.id, !isRegionSelected(region.id))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="ml-4">
                  <p className="font-semibold">{region.label || `Region ${region.id.substring(0, 6)}`}</p>
                  <p className="text-sm text-gray-300">
                    {formatTime(region.start)} - {formatTime(region.end)}
                  </p>
                </div>
              </div>
              <div className="space-x-2">
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => handleEditRegion(region)}
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <EditRegionModal
        region={selectedRegion}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveChanges}
      />
    </div>
  );
} 