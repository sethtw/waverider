/**
 * Profile Panel Component for managing audio analysis profiles
 * @module components/ProfilePanel
 */

import React, { useState, useEffect } from 'react';
import { analysisService } from '../../services/analysisService';
import { logger } from '../../utils/logger';
import type { AudioProfile, ProfileType, ProfileParameters } from '../../types';

interface ProfilePanelProps {
  className?: string;
}

interface ProfileFormData {
  name: string;
  description: string;
  type: ProfileType;
  parameters: ProfileParameters;
}

const defaultFormData: ProfileFormData = {
  name: '',
  description: '',
  type: 'custom',
  parameters: {}
};

const profileTypeDescriptions: Record<ProfileType, string> = {
  quiet: 'Detects quiet sections with low amplitude',
  intensity: 'Detects high-intensity sections',
  transition: 'Detects transitions between different sections',
  custom: 'Custom profile with user-defined parameters'
};

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ className = '' }) => {
  const [profiles, setProfiles] = useState<AudioProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AudioProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>(defaultFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const log = logger.child('ProfilePanel');

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const loadedProfiles = await analysisService.getProfiles();
      setProfiles(loadedProfiles);
      log.info('Profiles loaded', { count: loadedProfiles.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profiles';
      log.error('Failed to load profiles', error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = () => {
    setEditingProfile(null);
    setFormData(defaultFormData);
    setShowForm(true);
    setError(null);
  };

  const handleEditProfile = (profile: AudioProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      description: profile.description,
      type: profile.type,
      parameters: { ...profile.parameters }
    });
    setShowForm(true);
    setError(null);
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (deleteConfirm !== profileId) {
      setDeleteConfirm(profileId);
      return;
    }

    try {
      setLoading(true);
      await analysisService.deleteProfile(profileId);
      await loadProfiles();
      log.info('Profile deleted', { profileId });
      setDeleteConfirm(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete profile';
      log.error('Failed to delete profile', error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Profile name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingProfile) {
        // Update existing profile
        await analysisService.updateProfile(editingProfile.id, formData);
        log.info('Profile updated', { profileId: editingProfile.id });
      } else {
        // Create new profile
        await analysisService.createProfile(formData);
        log.info('Profile created', { name: formData.name });
      }

      await loadProfiles();
      setShowForm(false);
      setFormData(defaultFormData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      log.error('Failed to save profile', error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProfile(null);
    setFormData(defaultFormData);
    setError(null);
  };

  const handleParameterChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: value
      }
    }));
  };

  const renderParameterForm = () => {
    switch (formData.type) {
      case 'quiet':
        return (
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">Max Amplitude</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.parameters.maxAmplitude || 0.1}
                onChange={(e) => handleParameterChange('maxAmplitude', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Duration (seconds)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.parameters.minDuration || 1.0}
                onChange={(e) => handleParameterChange('minDuration', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              />
            </div>
          </div>
        );

      case 'intensity':
        return (
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">Min Amplitude</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.parameters.minAmplitude || 0.7}
                onChange={(e) => handleParameterChange('minAmplitude', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Threshold</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.parameters.threshold || 0.5}
                onChange={(e) => handleParameterChange('threshold', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              />
            </div>
          </div>
        );

      case 'transition':
        return (
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">Sensitivity</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.parameters.sensitivity || 0.3}
                onChange={(e) => handleParameterChange('sensitivity', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Window Size</label>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.parameters.windowSize || 1024}
                onChange={(e) => handleParameterChange('windowSize', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              />
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-400">
              Custom parameters can be added after creation via the API or by editing the JSON directly.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`panel ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Audio Profiles</h3>
        <button
          onClick={handleCreateProfile}
          disabled={loading || showForm}
          className="btn-primary text-sm px-3 py-1"
        >
          + New Profile
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center text-gray-400 py-4">
          Loading...
        </div>
      )}

      {showForm && (
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <h4 className="font-medium mb-3">
            {editingProfile ? 'Edit Profile' : 'Create New Profile'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                placeholder="Profile name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                rows={2}
                placeholder="Profile description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ProfileType }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                {Object.entries(profileTypeDescriptions).map(([type, description]) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)} - {description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Parameters</label>
              {renderParameterForm()}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Saving...' : (editingProfile ? 'Update' : 'Create')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="space-y-2">
          {profiles.length === 0 && !loading ? (
            <div className="text-center text-gray-400 py-4">
              No profiles created yet
            </div>
          ) : (
            profiles.map(profile => (
              <div key={profile.id} className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium">{profile.name}</h5>
                    <p className="text-sm text-gray-400">{profile.description}</p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditProfile(profile)}
                      disabled={loading}
                      className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1"
                    >
                      Edit
                    </button>
                    {!profile.isDefault && (
                      <button
                        onClick={() => handleDeleteProfile(profile.id)}
                        disabled={loading}
                        className={`text-sm px-2 py-1 ${
                          deleteConfirm === profile.id 
                            ? 'text-red-300 bg-red-900/20' 
                            : 'text-red-400 hover:text-red-300'
                        }`}
                      >
                        {deleteConfirm === profile.id ? 'Confirm?' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                    {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)}
                  </span>
                  {profile.isDefault && (
                    <span className="text-yellow-400 text-xs">Default</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}; 