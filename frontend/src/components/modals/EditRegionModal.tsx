/**
 * Modal for editing an audio region.
 * @module components/modals/EditRegionModal
 */

import React, { useState, useEffect } from 'react';
import type { AudioRegion } from '../../types';

interface EditRegionModalProps {
  region: AudioRegion | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<AudioRegion>) => void;
}

export function EditRegionModal({ region, isOpen, onClose, onSave }: EditRegionModalProps) {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (region) {
      setStart(region.start);
      setEnd(region.end);
      setLabel(region.label || '');
    }
  }, [region]);

  const handleSave = () => {
    onSave({ start, end, label });
  };

  if (!isOpen || !region) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Region</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-300">
                Label
              </label>
              <input
                type="text"
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="input mt-1 block w-full"
              />
            </div>
            <div>
              <label htmlFor="start" className="block text-sm font-medium text-gray-300">
                Start Time
              </label>
              <input
                type="number"
                id="start"
                value={start}
                onChange={(e) => setStart(Number(e.target.value))}
                step="0.01"
                className="input mt-1 block w-full"
              />
            </div>
            <div>
              <label htmlFor="end" className="block text-sm font-medium text-gray-300">
                End Time
              </label>
              <input
                type="number"
                id="end"
                value={end}
                onChange={(e) => setEnd(Number(e.target.value))}
                step="0.01"
                className="input mt-1 block w-full"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 