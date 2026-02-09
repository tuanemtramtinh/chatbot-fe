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

export interface UseCaseDetail {
  id: string | number;
  name: string;
  actors: string;
  description: string;
  preconditions: string;
  postconditions: string;
  mainFlow: string;
  alternativeFlow: string;
  scores: {
    completeness: number; // 0-100
    correctness: number; // 0-100
    relevance: number; // 0-100
  };
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
export interface Step4Request {
  thread_id: string;
  nodes: DiagramNode[]; // We send the finalized diagram nodes to context
}

export interface Step4Response {
  thread_id: string;
  interrupt: {
    type: 'review_scenarios';
    scenarios: UseCaseDetail[];
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

  generateScenarios: async (payload: Step4Request): Promise<Step4Response> => {
    console.log('Mocking Scenario Generation for:', payload.nodes.length, 'nodes');

    // Simulate Network Delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Filter only UseCase nodes
    const useCaseNodes = payload.nodes.filter((n) => n.category === 'Usecase');

    // Generate Mock Data
    const mockScenarios: UseCaseDetail[] = useCaseNodes.map((node) => ({
      id: node.key,
      name: node.label,
      actors: 'User, System',
      description: `Detailed specification for ${node.label}.`,
      preconditions: 'User must be logged in.',
      postconditions: 'Data is saved to database.',
      mainFlow: '1. User initiates action.\n2. System validates input.\n3. System performs task.\n4. System returns success message.',
      alternativeFlow: '3a. Validation fails: System shows error.',
      scores: {
        completeness: Math.floor(Math.random() * 20) + 80, // 80-99
        correctness: Math.floor(Math.random() * 20) + 80,
        relevance: Math.floor(Math.random() * 20) + 80,
      },
    }));

    return {
      thread_id: payload.thread_id,
      interrupt: {
        type: 'review_scenarios',
        scenarios: mockScenarios,
      },
    };
  },
};
