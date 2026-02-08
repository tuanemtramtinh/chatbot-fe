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

// ALIASES for backward compatibility with HomePage
export type BackendActor = ActorEntity;
export type Step2ActorPayload = ActorEntity;

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
};
