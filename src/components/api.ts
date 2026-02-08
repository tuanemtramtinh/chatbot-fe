// src/components/api.ts

// Use your actual backend URL (ensure port is correct)
const API_BASE_URL = 'http://127.0.0.1:8000';

export interface BackendActor {
  actor: string;
  aliases: string[];
  sentence_idx: number[];
}

export interface Step1Response {
  thread_id: string;
  interrupt: {
    type: 'review_actors';
    actors: BackendActor[];
  };
}

export const apiService = {
  extractActors: async (userStories: string[]): Promise<Step1Response> => {
    console.log('Sending step 1 Payload:', JSON.stringify(userStories));

    const response = await fetch(`${API_BASE_URL}/chat/step-1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userStories),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    return data;
  },
};
