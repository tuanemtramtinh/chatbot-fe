// src/types/storage.ts
import { type Actor } from '../components/ActorReview';
// import { type NodeData, type LinkData } from '../components/DiagramWrapper';
// import { type UseCaseDetail } from '../components/ScenarioReview';

// Data for Step 1
export interface Step1Data {
  initial: { rawInput: string; extractedActors: Actor[] };
  final?: {
    approvedActors: Actor[];
  };
}

// Data for Step 2 (Diagram & Scenarios)
// export interface Step2Data {
//   nodes: NodeData[];
//   links: LinkData[];
//   details: Record<number, UseCaseDetail>;
// }

// The Master Session Object
export interface ProjectSession {
  id: string; // Unique ID (threadID)
  name: string; // Display Name
  lastModified: number;
  currentPhase: 'input' | 'actor-review' | 'diagram-scenario-review';

  // Data Snapshots
  step1: Step1Data | null;
  // step2: Step2Data | null;
}

const STORAGE_KEY = 'genai_project_sessions'; // Changed key to avoid conflicts with old data

export const storageService = {
  // Get all sessions sorted by newest
  getSessions: (): ProjectSession[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Storage Error:', e);
      return [];
    }
  },

  // Save or Update a session
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

  // Delete session
  deleteSession: (id: string) => {
    const sessions = storageService.getSessions().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  },
};
