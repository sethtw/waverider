/**
 * Controllers for sessions API
 * @module controllers/sessions
 */

import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.ts';
import type { AudioSession } from '../types.ts';
import { sessions } from '../data/db.ts';

const log = logger.child({ service: 'sessionsController' });

export const getSessions = (req: Request, res: Response) => {
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
};

export const getSessionById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = sessions.find((s: AudioSession) => s.id === id);
    
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
};

export const createSession = (req: Request, res: Response) => {
  try {
    const { name, audioSource, analysis, playbackSettings, regions }: AudioSession = req.body;
    
    if (!name || !audioSource) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, audioSource'
      });
    }
    
    const newSession: AudioSession = {
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
};

export const updateSession = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: Partial<AudioSession> = req.body;
    
    const sessionIndex = sessions.findIndex((s: AudioSession) => s.id === id);
    
    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    const updatedSession: AudioSession = {
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
};

export const deleteSession = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const sessionIndex = sessions.findIndex((s: AudioSession) => s.id === id);
    
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
};

export const exportSession = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = sessions.find((s: AudioSession) => s.id === id);
    
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
};

export const importSession = (req: Request, res: Response) => {
  try {
    const { sessionData }: { sessionData: { session: AudioSession } } = req.body;
    
    if (!sessionData || !sessionData.session) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session data format'
      });
    }
    
    const importedSession: AudioSession = {
      ...sessionData.session,
      id: uuidv4(),
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
}; 