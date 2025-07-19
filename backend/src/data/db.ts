/**
 * In-memory database for profiles and sessions
 * @module data/db
 */

import type { AudioProfile, AudioSession } from '../types.ts';

export let profiles: AudioProfile[] = [
  {
    id: 'quiet-profile',
    name: 'Quiet Section',
    description: 'Detects periods of low amplitude audio',
    type: 'quiet',
    parameters: {
      maxAmplitude: 0.1,
      minDuration: 2.0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: true,
  },
  {
    id: 'intensity-profile',
    name: 'High Intensity',
    description: 'Detects periods of high amplitude audio',
    type: 'intensity',
    parameters: {
      minAmplitude: 0.7,
      threshold: 0.8,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: true,
  },
  {
    id: 'transition-profile',
    name: 'Transition',
    description: 'Detects transition periods between quiet and loud',
    type: 'transition',
    parameters: {
      sensitivity: 0.5,
      windowSize: 1.0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: true,
  },
];

export let sessions: AudioSession[] = []; 