// src/components/api.ts
const API_BASE_URL = 'http://127.0.0.1:8000';

// --- SHARED CORE TYPES ---
export interface AliasEntity {
  alias: string;
  sentences: number[];
}

export interface ActorEntity {
  actor: string;
  aliases: AliasEntity[];
  sentence_idx: number[];
}
// --- STEP 2 SPECIFIC TYPES ---
export interface BackendUserStory {
  actor: string;
  action: string;
  original_sentence: string;
  sentence_idx: number;
}

export interface BackendUseCase {
  id: number;
  name: string;
  description: string;
  participating_actors: string[];
  user_stories: BackendUserStory[];
  relationships?: { type: string; target_use_case: string }[];
}

export interface DiagramNode {
  key: string | number; // Support both for flexibility
  category: 'Actor' | 'Usecase';
  label: string;
  loc?: string; // "x y" string for GoJS
  isGroup?: boolean;
  group?: string | number;
}

export interface DiagramLink {
  key?: string | number;
  from: string | number;
  to: string | number;
  text?: string; // Label like <<include>>
}

// --- API RESPONSE TYPES ---
export interface Step1Response {
  thread_id: string;
  interrupt: {
    type: 'review_actors';
    actors: ActorEntity[];
  };
}

export interface Step2Request {
  thread_id: string;
  actors: ActorEntity[];
}
export interface Step2Response {
  thread_id: string;
  interrupt: {
    type: 'review_usecases';
    usecases: BackendUseCase[];
  };
}

export interface Step3Request {
  thread_id: string;
  usecases: BackendUseCase[];
}
export interface Step3Response {
  nodes: DiagramNode[];
  links: DiagramLink[];
}

// --- SERVICE ---

export const apiService = {
  extractActors: async (userStories: string[]): Promise<Step1Response> => {
    console.log('Sending Step 1 Payload:', JSON.stringify(userStories));

    const response = await fetch(`${API_BASE_URL}/chat/step-1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userStories),
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log('Actor List Return:', data);
    return data;
  },

  extractUseCases: async (payload: Step2Request): Promise<Step2Response> => {
    console.log('Sending Step 2 Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${API_BASE_URL}/chat/step-2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log('Usecase List Return:', data);
    return data;
  },

  generateDiagram: async (payload: Step3Request): Promise<Step3Response> => {
    console.log('Sending Step 3 Payload:', JSON.stringify(payload, null, 2));
    const response = await fetch(`${API_BASE_URL}/chat/step-3`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error((await response.json()).detail || response.statusText);
    const data = await response.json();
    console.log('Diagram Return:', data);
    return data;
  },
};
