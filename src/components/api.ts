// src/components/api.ts
const API_BASE_URL = 'http://127.0.0.1:8000';

// --- Actor types ---
export interface AliasEntity {
  alias: string;
  sentences: number[];
}
export interface ActorEntity {
  actor: string;
  aliases: AliasEntity[];
  sentence_idx: number[];
}
// Usecase
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
// Diagram
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
// Scenario
interface RawUseCaseSpec {
  use_case_name: string;
  unique_id: string;
  area: string;
  context_of_use: string;
  scope: string;
  level: string;
  primary_actors: string[];
  supporting_actors: string[];
  stakeholders_and_interests: string[];
  description: string;
  triggering_event: string;
  trigger_type: string;
  preconditions: string[];
  postconditions: string[];
  assumptions: string[];
  requirements_met: string[];
  priority: string;
  risk: string;
  outstanding_issues: string[];
  main_flow: string[];
  alternative_flows: string[];
  exception_flows: string[];
  information_for_steps: string[];
}

interface RawEvaluation {
  completeness: { score: number };
  correctness: { score: number | null };
  relevance: { score: number };
}

export interface RawScenarioResult {
  use_case: BackendUseCase;
  use_case_spec_json: RawUseCaseSpec;
  evaluation: RawEvaluation;
}

export interface UseCaseDetail {
  id: string;
  name: string;
  actors: string;
  description: string;
  trigger: string;
  preconditions: string;
  postconditions: string;
  mainFlow: string;
  alternativeFlow: string;
  exceptionFlow: string;
  scores: {
    completeness: number;
    correctness: number;
    relevance: number;
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
}

export interface Step4Response {
  thread_id: string;
  count: number;
  results: RawScenarioResult[];
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
    console.log('Sending Step 4 Payload:', JSON.stringify(payload, null, 2));
    const response = await fetch(`${API_BASE_URL}/chat/step-4`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error((await response.json()).detail || response.statusText);
    const data = await response.json();
    console.log('Scenario Return:', data);
    return data;
  },
};
