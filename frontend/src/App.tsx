/**
 * Main App component for Waverider
 * @module App
 */

import React from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { logger } from './utils/logger';
import { WaveformViewer } from './components/WaveformViewer/WaveformViewer';
import { AudioInput } from './components/AudioInput/AudioInput';
import { AnalysisPanel } from './components/AnalysisPanel/AnalysisPanel';
import { ProfilePanel } from './components/ProfilePanel/ProfilePanel';
import { SessionPanel } from './components/SessionPanel/SessionPanel';
import { useAudioStore } from './stores/audioStore';
import { formatTime } from './utils';
import './App.css';

function App() {
  logger.info('Waverider application starting');

  return (
    <ThemeProvider defaultTheme="dark">
      <div className="min-h-screen bg-one-dark-bg text-one-dark-fg transition-colors duration-200">
        <header className="border-b border-gray-700 bg-one-dark-bg-alt">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gradient">
                  Waverider
                </h1>
                <span className="ml-2 text-sm text-one-dark-fg-alt">
                  Audio Analysis Platform
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="space-y-6">
                <AudioInputPanel />
                <ProfilePanel />
                <SessionPanel />
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                <WaveformPanel />
                <ControlsPanel />
                <AnalysisPanel />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

// Placeholder components - these will be implemented in the next phase
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-gray-700 transition-colors duration-200"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

function AudioInputPanel() {
  return (
    <div className="panel">
      <h3 className="text-lg font-semibold mb-4">Audio Input</h3>
      <AudioInput />
    </div>
  );
}





function WaveformPanel() {
  const { currentSource, isLoading, error } = useAudioStore();

  if (isLoading) {
    return (
      <div className="panel">
        <h3 className="text-lg font-semibold mb-4">Waveform</h3>
        <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-one-dark-fg-alt">
            Loading audio...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <h3 className="text-lg font-semibold mb-4">Waveform</h3>
        <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-red-400">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3 className="text-lg font-semibold mb-4">Waveform</h3>
      <WaveformViewer height={300} />
    </div>
  );
}

function ControlsPanel() {
  const { 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    speed,
    play, 
    pause, 
    seek, 
    setVolume, 
    setSpeed,
    currentSource,
    isReady
  } = useAudioStore();

  const handlePlayPause = () => {
    console.log('Play button clicked', { isPlaying });
    if (isPlaying) {
      console.log('Calling pause()');
      pause();
    } else {
      console.log('Calling play()');
      play();
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(event.target.value);
    seek(time);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
  };

  const handleSpeedChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSpeed = parseFloat(event.target.value);
    setSpeed(newSpeed);
  };

  // Don't show controls if no audio is loaded
  if (!currentSource) {
    return (
      <div className="panel">
        <h3 className="text-lg font-semibold mb-4">Playback Controls</h3>
        <div className="text-center text-gray-400 py-8">
          Load an audio file to enable playback controls
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3 className="text-lg font-semibold mb-4">Playback Controls</h3>
      <div className="flex items-center space-x-4">
        <button className="btn-secondary" disabled>
          ⏮️
        </button>
        <button 
          className="btn-secondary" 
          onClick={handlePlayPause}
          disabled={!isReady}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button className="btn-secondary" disabled>
          ⏭️
        </button>
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            disabled={!isReady}
            className="w-full"
          />
        </div>
        <span className="text-sm text-one-dark-fg-alt">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-one-dark-fg-alt">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            disabled={!isReady}
            className="w-20"
          />
        </div>
        <select
          value={speed}
          onChange={handleSpeedChange}
          disabled={!isReady}
          className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm"
        >
          <option value={0.25}>0.25x</option>
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
      </div>
    </div>
  );
}





export default App;
