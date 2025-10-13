// src/lib/config/openrouter.config.ts

/**
 * OpenRouter API Configuration
 * Centralized configuration for OpenRouter service
 */
export const OPENROUTER_CONFIG = {
  /**
   * Default model for AI operations
   */
  DEFAULT_MODEL: "openai/gpt-4o-mini",

  /**
   * API base URL
   */
  BASE_URL: "https://openrouter.ai/api/v1",

  /**
   * Request timeout in milliseconds
   */
  TIMEOUT_MS: 30000,

  /**
   * HTTP headers for API requests
   */
  HEADERS: {
    HTTP_REFERER: "https://flashcard-generator.local",
    X_TITLE: "Flashcard Generator",
  },

  /**
   * Retry configuration
   */
  RETRY: {
    MAX_RETRIES: 3,
    INITIAL_DELAY_MS: 1000,
  },
} as const;

/**
 * Model-specific parameters for flashcard generation
 */
export const FLASHCARD_GENERATION_PARAMS = {
  /**
   * Temperature controls randomness (0.0-2.0)
   * Lower = more focused and deterministic
   * Higher = more random and creative
   */
  temperature: 0.7,

  /**
   * Maximum tokens in the response
   */
  max_tokens: 2000,

  /**
   * Number of flashcards to generate
   */
  flashcardsCount: 10,
} as const;
