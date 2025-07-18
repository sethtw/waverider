/**
 * Main App component for Waverider
 * @module App
 */

import React from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { logger } from './utils/logger';
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
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Audio Source
          </label>
          <select className="input w-full">
            <option>Select audio source...</option>
            <option>Local File</option>
            <option>URL</option>
            <option>YouTube</option>
          </select>
        </div>
        <button className="btn-primary w-full">
          Load Audio
        </button>
      </div>
    </div>
  );
}

function ProfilePanel() {
  return (
    <div className="panel">
      <h3 className="text-lg font-semibold mb-4">Audio Profiles</h3>
      <div className="space-y-2">
        <div className="text-sm text-one-dark-fg-alt">
          No profiles loaded
        </div>
        <button className="btn-secondary w-full">
          Create Profile
        </button>
      </div>
    </div>
  );
}

function SessionPanel() {
  return (
    <div className="panel">
      <h3 className="text-lg font-semibold mb-4">Sessions</h3>
      <div className="space-y-2">
        <div className="text-sm text-one-dark-fg-alt">
          No sessions saved
        </div>
        <button className="btn-secondary w-full">
          Save Session
        </button>
      </div>
    </div>
  );
}

function WaveformPanel() {
  return (
    <div className="panel">
      <h3 className="text-lg font-semibold mb-4">Waveform</h3>
      <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-one-dark-fg-alt">
          Load an audio file to see the waveform
        </div>
      </div>
    </div>
  );
}

function ControlsPanel() {
  return (
    <div className="panel">
      <h3 className="text-lg font-semibold mb-4">Playback Controls</h3>
      <div className="flex items-center space-x-4">
        <button className="btn-secondary" disabled>
          ⏮️
        </button>
        <button className="btn-secondary" disabled>
          ▶️
        </button>
        <button className="btn-secondary" disabled>
          ⏸️
        </button>
        <button className="btn-secondary" disabled>
          ⏭️
        </button>
        <div className="flex-1">
          <input
            type="range"
            className="w-full"
            disabled
          />
        </div>
        <span className="text-sm text-one-dark-fg-alt">
          00:00 / 00:00
        </span>
      </div>
    </div>
  );
}

function AnalysisPanel() {
  return (
    <div className="panel">
      <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
      <div className="text-sm text-one-dark-fg-alt">
        No analysis results available
      </div>
    </div>
  );
}



export default App;
