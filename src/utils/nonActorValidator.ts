// src/utils/nonActorValidator.ts

// Forbidden words that are not considered Actors
const FORBIDDEN_WORDS = [
  'system',
  'database',
  'server',
  'api',
  'application',
  'service',
  'module',
  'component',
  'interface',
  'backend',
  'frontend',
  'hệ thống',
  'cơ sở dữ liệu',
  'máy chủ',
  'ứng dụng',
  'dịch vụ',
  'giao diện',
];

// Create regex pattern for forbidden words (case-insensitive)
const FORBIDDEN_PATTERN = new RegExp(`\\b(${FORBIDDEN_WORDS.join('|')})\\b`, 'i');

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  forbiddenWords?: string[];
}

// Validates if the input contains non-actor words
export const validateNonActor = (input: string): ValidationResult => {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      error: 'Actor không được để trống',
    };
  }

  const matches = input.match(FORBIDDEN_PATTERN);
  if (matches) {
    const forbiddenWords = matches.map((m) => m.toLowerCase());
    return {
      isValid: false,
      error: `Actor không được chứa từ cấm: ${forbiddenWords.join(', ')}. Actor phải là người dùng hoặc vai trò, không phải hệ thống hoặc công nghệ.`,
      forbiddenWords,
    };
  }

  return {
    isValid: true,
  };
};

// Check if a word is forbidden (non-actor)
export const isForbiddenWord = (word: string): boolean => {
  return FORBIDDEN_PATTERN.test(word);
};
