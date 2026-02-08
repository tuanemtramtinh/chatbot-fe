// src/types/storage.ts
import type { ActorEntity, BackendUseCase } from '../components/api';

// Data for Step 1
export interface Step1Data {
  initial: {
    rawInput: string;
    extractedActors: ActorEntity[];
  };
  final?: {
    candidateActors: ActorEntity[];
    approvedActors: ActorEntity[];
  };
}

// Data for Step 2 (Use Cases)
export interface Step2Data {
  initial: {
    extractedUseCases: BackendUseCase[];
  };
  final?: {
    approvedUseCases: BackendUseCase[];
  };
}

// The Master Session Object
export interface ProjectSession {
  id: string;
  name: string;
  lastModified: number;
  currentPhase: 'input' | 'actor-review' | 'usecase-review' | 'diagram-scenario-review';

  step1: Step1Data | null;
  step2: Step2Data | null;
}

const STORAGE_KEY = 'genai_project_sessions';

export const storageService = {
  getSessions: (): ProjectSession[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Storage Error:', e);
      return [];
    }
  },

  saveSession: (session: ProjectSession) => {
    const sessions = storageService.getSessions();
    const index = sessions.findIndex((s) => s.id === session.id);

    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  },

  deleteSession: (id: string) => {
    const sessions = storageService.getSessions().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  },
};
