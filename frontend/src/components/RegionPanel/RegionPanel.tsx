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
  const activeRegion = useAudioStore((state) => state.activeRegion);
  const selectedRegions = useAudioStore((state) => state.selectedRegions);
  const {
    removeRegion,
    updateRegion,
    playRegion,
    selectRegion,
    exportRegions,
    importRegions,
  } = useAudioStore.getState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<AudioRegion | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleRemoveRegion = (id: string) => {
    logger.info(`Request to remove region ${id}`);
    removeRegion(id);
  };

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

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Regions</h3>
        <div className="space-x-2">
          <button className="btn-secondary" onClick={triggerImport}>
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
            accept=".json"
          />
          <button className="btn-secondary" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>
      {regions.length === 0 ? (
        <p className="text-gray-400">No regions created yet.</p>
      ) : (
        <ul className="space-y-2">
          {regions.map((region) => (
            <li
              key={region.id}
              className={`p-3 rounded-md flex justify-between items-center transition-colors ${
                activeRegion?.id === region.id
                  ? 'bg-indigo-600'
                  : isRegionSelected(region.id)
                  ? 'bg-blue-600'
                  : 'bg-gray-700'
              }`}
            >
              <div>
                <p className="font-semibold">{region.label || `Region ${region.id.substring(0, 6)}`}</p>
                <p className="text-sm text-gray-300">
                  {formatTime(region.start)} - {formatTime(region.end)}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  className="btn-primary btn-sm"
                  onClick={() => selectRegion(region.id, !isRegionSelected(region.id))}
                >
                  {isRegionSelected(region.id) ? 'Deselect' : 'Select'}
                </button>
                <button
                  className="btn-primary btn-sm"
                  onClick={() => playRegion(region)}
                >
                  Play
                </button>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => handleEditRegion(region)}
                >
                  Edit
                </button>
                <button
                  className="btn-danger btn-sm"
                  onClick={() => handleRemoveRegion(region.id)}
                >
                  Delete
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