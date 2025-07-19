/**
 * Session Panel Component for managing audio analysis sessions
 * @module components/SessionPanel
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { analysisService } from '../../services/analysisService';
import { logger } from '../../utils/logger';
import type { AudioSession } from '../../types';

interface SessionPanelProps {
  className?: string;
}

export const SessionPanel: React.FC<SessionPanelProps> = ({ className = '' }) => {
  const {
    currentSource,
    sessions: localSessions,
    currentSession,
    saveSession,
    loadSession,
    deleteSession,
    exportSession,
    importSession
  } = useAudioStore();

  const [backendSessions, setBackendSessions] = useState<AudioSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [showImportForm, setShowImportForm] = useState(false);
  const [importData, setImportData] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saveToBackend, setSaveToBackend] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const log = logger.child('SessionPanel');

  // Load backend sessions on mount
  useEffect(() => {
    loadBackendSessions();
  }, []);

  const loadBackendSessions = async () => {
    try {
      setLoading(true);
      const sessions = await analysisService.getSessions();
      setBackendSessions(sessions);
      log.info('Backend sessions loaded', { count: sessions.length });
    } catch (error) {
      log.error('Failed to load backend sessions', error instanceof Error ? error : new Error(String(error)));
      // Don't set error here as local sessions should still work
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSession = async () => {
    if (!currentSource) {
      setError('No audio loaded to save session');
      return;
    }

    if (!sessionName.trim()) {
      setError('Session name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Save to local store
      saveSession(sessionName.trim());

      // Save to backend if enabled
      if (saveToBackend) {
        const sessionData = {
          name: sessionName.trim(),
          audioSource: currentSource,
          analysis: {
            id: crypto.randomUUID(),
            audioSourceId: currentSource.id,
            regions: useAudioStore.getState().regions,
            profiles: useAudioStore.getState().profiles,
            analysisDate: new Date(),
            version: '1.0.0',
            analysis: {
              amplitude: {},
              spectral: {},
              patterns: {},
              regions: useAudioStore.getState().regions
            }
          },
          playbackSettings: {
            volume: useAudioStore.getState().volume,
            speed: useAudioStore.getState().speed,
            selectedRegions: useAudioStore.getState().selectedRegions,
            loopEnabled: false,
            envelopePoints: useAudioStore.getState().envelopePoints,
          },
          regions: useAudioStore.getState().regions,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await analysisService.createSession(sessionData);
        await loadBackendSessions();
        log.info('Session saved to backend', { name: sessionName });
      }

      setShowSaveForm(false);
      setSessionName('');
      log.info('Session saved successfully', { name: sessionName, backend: saveToBackend });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save session';
      log.error('Failed to save session', error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSession = (sessionId: string, isBackend: boolean = false) => {
    try {
      if (isBackend) {
        const session = backendSessions.find(s => s.id === sessionId);
        if (session) {
          // Convert backend session to local format and load
          loadSession(sessionId);
          log.info('Backend session loaded', { sessionId });
        }
      } else {
        loadSession(sessionId);
        log.info('Local session loaded', { sessionId });
      }
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session';
      log.error('Failed to load session', error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage);
    }
  };

  const handleDeleteSession = async (sessionId: string, isBackend: boolean = false) => {
    if (deleteConfirm !== sessionId) {
      setDeleteConfirm(sessionId);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isBackend) {
        await analysisService.deleteSession(sessionId);
        await loadBackendSessions();
        log.info('Backend session deleted', { sessionId });
      } else {
        deleteSession(sessionId);
        log.info('Local session deleted', { sessionId });
      }

      setDeleteConfirm(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete session';
      log.error('Failed to delete session', error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSession = (sessionId: string, isBackend: boolean = false) => {
    try {
      let sessionData: string;
      
      if (isBackend) {
        const session = backendSessions.find(s => s.id === sessionId);
        if (!session) {
          throw new Error('Backend session not found');
        }
        sessionData = JSON.stringify(session, null, 2);
      } else {
        sessionData = exportSession(sessionId);
      }

      // Create and download file
      const blob = new Blob([sessionData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waverider-session-${sessionId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      log.info('Session exported', { sessionId, backend: isBackend });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export session';
      log.error('Failed to export session', error instanceof Error ? error : new Error(String(error)));
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

  const handleImportSession = () => {
    try {
      setError(null);
      importSession(importData);
      setShowImportForm(false);
      setImportData('');
      log.info('Session imported successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import session';
      log.error('Failed to import session', error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage);
    }
  };

  const allSessions = [...localSessions, ...backendSessions];
  const uniqueSessions = allSessions.filter((session, index, self) => 
    index === self.findIndex(s => s.id === session.id)
  );

  return (
    <div className={`panel ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Sessions</h3>
        <div className="flex space-x-1">
          <button
            onClick={() => setShowSaveForm(true)}
            disabled={!currentSource || loading || showSaveForm}
            className="btn-primary text-sm px-2 py-1"
            title="Save current session"
          >
            💾
          </button>
          <button
            onClick={handleImportFromFile}
            disabled={loading}
            className="btn-secondary text-sm px-2 py-1"
            title="Import session from file"
          >
            📁
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center text-gray-400 py-2 text-sm">
          Loading...
        </div>
      )}

      {/* Save Session Form */}
      {showSaveForm && (
        <div className="bg-gray-800 p-3 rounded-lg mb-4">
          <h4 className="font-medium mb-3">Save Session</h4>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Session name"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={saveToBackend}
                  onChange={(e) => setSaveToBackend(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500"
                />
                <span>Save to backend (persistent)</span>
              </label>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveSession}
                disabled={loading || !sessionName.trim()}
                className="btn-primary flex-1 text-sm"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveForm(false);
                  setSessionName('');
                  setError(null);
                }}
                disabled={loading}
                className="btn-secondary flex-1 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Session Form */}
      {showImportForm && (
        <div className="bg-gray-800 p-3 rounded-lg mb-4">
          <h4 className="font-medium mb-3">Import Session</h4>
          <div className="space-y-3">
            <div>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste session JSON data here..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                rows={4}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleImportSession}
                disabled={loading || !importData.trim()}
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
                disabled={loading}
                className="btn-secondary flex-1 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-2">
        {uniqueSessions.length === 0 && !loading ? (
          <div className="text-center text-gray-400 py-4 text-sm">
            No sessions saved yet
          </div>
        ) : (
          uniqueSessions.map(session => {
            const isBackendSession = backendSessions.some(s => s.id === session.id);
            const isCurrent = currentSession?.id === session.id;
            
            return (
              <div 
                key={session.id} 
                className={`bg-gray-800 p-3 rounded-lg ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{session.name}</h5>
                    <p className="text-xs text-gray-400">
                      {session.audioSource.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleLoadSession(session.id, isBackendSession)}
                      disabled={loading}
                      className="text-blue-400 hover:text-blue-300 text-xs px-1 py-1"
                      title="Load session"
                    >
                      📂
                    </button>
                    <button
                      onClick={() => handleExportSession(session.id, isBackendSession)}
                      disabled={loading}
                      className="text-green-400 hover:text-green-300 text-xs px-1 py-1"
                      title="Export session"
                    >
                      📤
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id, isBackendSession)}
                      disabled={loading}
                      className={`text-xs px-1 py-1 ${
                        deleteConfirm === session.id 
                          ? 'text-red-300 bg-red-900/20' 
                          : 'text-red-400 hover:text-red-300'
                      }`}
                      title="Delete session"
                    >
                      {deleteConfirm === session.id ? '✓' : '🗑️'}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex space-x-2">
                    <span className="bg-gray-700 px-2 py-0.5 rounded">
                      {session.regions.length} regions
                    </span>
                    {isBackendSession && (
                      <span className="bg-blue-700 px-2 py-0.5 rounded">Backend</span>
                    )}
                    {isCurrent && (
                      <span className="bg-green-700 px-2 py-0.5 rounded">Current</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Hidden file input */}
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