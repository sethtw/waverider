/**
 * Audio input component for loading audio files
 * @module components/AudioInput
 */

import React, { useState, useRef, useCallback } from 'react';
import { logger } from '../../utils/logger';
import { useAudioStore } from '../../stores/audioStore';
import { audioLoader } from '../../services/audioLoader';
import type { AudioLoadOptions } from '../../services/audioLoader';
import { generateId, isValidUrl, isValidAudioFile } from '../../utils';

interface AudioInputProps {
  className?: string;
}

export function AudioInput({ className = '' }: AudioInputProps) {
  const [inputType, setInputType] = useState<'file' | 'url' | 'youtube'>('file');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadAudio, setError, setLoading } = useAudioStore();

  const log = logger.child('AudioInput');

  const handleLoadAudio = useCallback(async (options: AudioLoadOptions) => {
    setIsLoading(true);
    setLoading(true);
    setError(null);

    try {
      log.info('Loading audio', { type: options.type, source: options.source });
      
      const result = await audioLoader.loadAudio(options);
      
      if (result.success && result.source) {
        await loadAudio(result.source);
        setInputValue('');
        log.info('Audio loaded successfully', { name: result.source.name });
      } else {
        setError(result.error || 'Failed to load audio');
        log.error('Failed to load audio', new Error(result.error || 'Unknown error'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audio';
      setError(errorMessage);
      log.error('Audio loading error', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }, [loadAudio, setError, setLoading]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!isValidAudioFile(file.name)) {
      setError('Invalid audio file format. Please select a valid audio file.');
      return;
    }

    // Create a local URL for the file
    const fileUrl = URL.createObjectURL(file);
    
    await handleLoadAudio({
      type: 'file',
      source: fileUrl,
      name: file.name,
    });
  }, [handleLoadAudio, setError]);

  const handleUrlSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    if (!isValidUrl(inputValue)) {
      setError('Please enter a valid URL');
      return;
    }

    await handleLoadAudio({
      type: inputType,
      source: inputValue.trim(),
    });
  }, [inputValue, inputType, handleLoadAudio, setError]);

  const handleYouTubeSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(inputValue)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    await handleLoadAudio({
      type: 'youtube',
      source: inputValue.trim(),
    });
  }, [inputValue, handleLoadAudio, setError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  }, [handleFileUpload]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Input Type Selector */}
      <div className="flex space-x-2">
        <button
          onClick={() => setInputType('file')}
          className={`px-3 py-1 rounded text-sm ${
            inputType === 'file' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          File
        </button>
        <button
          onClick={() => setInputType('url')}
          className={`px-3 py-1 rounded text-sm ${
            inputType === 'url' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          URL
        </button>
        <button
          onClick={() => setInputType('youtube')}
          className={`px-3 py-1 rounded text-sm ${
            inputType === 'youtube' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          YouTube
        </button>
      </div>

      {/* File Upload */}
      {inputType === 'file' && (
        <div
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            <div className="text-lg font-medium">
              {dragActive ? 'Drop audio file here' : 'Drag & drop audio file'}
            </div>
            <div className="text-sm text-gray-400">
              or
            </div>
            <button
              onClick={handleBrowseClick}
              disabled={isLoading}
              className="btn-primary"
            >
              Browse Files
            </button>
            <div className="text-xs text-gray-500">
              Supports: MP3, WAV, OGG, M4A, FLAC, AAC, WMA
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* URL Input */}
      {inputType === 'url' && (
        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Audio URL
            </label>
            <input
              type="url"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="https://example.com/audio.mp3"
              disabled={isLoading}
              className="input w-full"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="btn-primary w-full"
          >
            {isLoading ? 'Loading...' : 'Load Audio'}
          </button>
        </form>
      )}

      {/* YouTube Input */}
      {inputType === 'youtube' && (
        <form onSubmit={handleYouTubeSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              YouTube URL
            </label>
            <input
              type="url"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={isLoading}
              className="input w-full"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="btn-primary w-full"
          >
            {isLoading ? 'Loading...' : 'Load YouTube Audio'}
          </button>
        </form>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <div className="text-sm text-gray-400 mt-2">Loading audio...</div>
        </div>
      )}
    </div>
  );
} 