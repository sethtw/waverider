/**
 * Sessions API routes
 * @module routes/sessions
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

const router = express.Router();
const log = logger.child({ service: 'sessionRoutes' });

// In-memory storage for sessions (in production, use a database)
let sessions = [];

/**
 * GET /api/sessions
 * Get all sessions
 */
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    log.error('Failed to get sessions', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sessions'
    });
  }
});

/**
 * GET /api/sessions/:id
 * Get a specific session
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const session = sessions.find(s => s.id === id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    log.error('Failed to get session', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve session'
    });
  }
});

/**
 * POST /api/sessions
 * Create a new session
 */
router.post('/', (req, res) => {
  try {
    const { name, audioSource, analysis, playbackSettings, regions } = req.body;
    
    if (!name || !audioSource) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, audioSource'
      });
    }
    
    const newSession = {
      id: uuidv4(),
      name,
      audioSource,
      analysis: analysis || null,
      playbackSettings: playbackSettings || {
        volume: 1,
        speed: 1,
        selectedRegions: [],
        loopEnabled: false,
        envelopePoints: []
      },
      regions: regions || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    sessions.push(newSession);
    
    log.info('Session created', { id: newSession.id, name: newSession.name });
    
    res.status(201).json({
      success: true,
      data: newSession
    });
  } catch (error) {
    log.error('Failed to create session', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
});

/**
 * PUT /api/sessions/:id
 * Update a session
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const sessionIndex = sessions.findIndex(s => s.id === id);
    
    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    const updatedSession = {
      ...sessions[sessionIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    sessions[sessionIndex] = updatedSession;
    
    log.info('Session updated', { id, name: updatedSession.name });
    
    res.json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    log.error('Failed to update session', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session'
    });
  }
});

/**
 * DELETE /api/sessions/:id
 * Delete a session
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const sessionIndex = sessions.findIndex(s => s.id === id);
    
    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    const deletedSession = sessions.splice(sessionIndex, 1)[0];
    
    log.info('Session deleted', { id, name: deletedSession.name });
    
    res.json({
      success: true,
      data: { message: 'Session deleted successfully' }
    });
  } catch (error) {
    log.error('Failed to delete session', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete session'
    });
  }
});

/**
 * POST /api/sessions/:id/export
 * Export a session
 */
router.post('/:id/export', (req, res) => {
  try {
    const { id } = req.params;
    const session = sessions.find(s => s.id === id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      session: session
    };
    
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    log.error('Failed to export session', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export session'
    });
  }
});

/**
 * POST /api/sessions/import
 * Import a session
 */
router.post('/import', (req, res) => {
  try {
    const { sessionData } = req.body;
    
    if (!sessionData || !sessionData.session) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session data format'
      });
    }
    
    const importedSession = {
      ...sessionData.session,
      id: uuidv4(), // Generate new ID for imported session
      name: `${sessionData.session.name} (Imported)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    sessions.push(importedSession);
    
    log.info('Session imported', { id: importedSession.id, name: importedSession.name });
    
    res.status(201).json({
      success: true,
      data: importedSession
    });
  } catch (error) {
    log.error('Failed to import session', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import session'
    });
  }
});

export { router as sessionRoutes }; 