// src/lib/services/openrouter.service.ts
import axios, { type AxiosInstance, type AxiosError } from "axios";
import Ajv, { type ValidateFunction } from "ajv";

/**
 * Message role types for chat completion
 */
export type MessageRole = "system" | "user";

/**
 * Chat message interface
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * JSON Schema response format configuration
 */
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: object;
  };
}

/**
 * Options for chat completion requests
 */
export interface ChatCompletionOptions {
  model?: string;
  parameters?: Record<string, any>;
  responseFormat?: ResponseFormat;
}

/**
 * Constructor options for OpenRouterService
 */
export interface OpenRouterServiceOptions {
  baseUrl?: string;
  defaultModel?: string;
  timeoutMs?: number;
}

/**
 * Custom error classes for better error handling
 */
export class OpenRouterAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterAuthError";
  }
}

export class OpenRouterRateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = "OpenRouterRateLimitError";
  }
}

export class OpenRouterResponseParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterResponseParseError";
  }
}

export class OpenRouterSchemaValidationError extends Error {
  constructor(
    message: string,
    public validationErrors?: any[]
  ) {
    super(message);
    this.name = "OpenRouterSchemaValidationError";
  }
}

export class OpenRouterNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterNetworkError";
  }
}

/**
 * OpenRouter Service
 * Handles communication with OpenRouter API for AI chat completions
 */
export class OpenRouterService {
  public readonly apiKey: string;
  public model: string;
  public readonly baseUrl: string;
  public readonly timeoutMs: number;

  private readonly httpClient: AxiosInstance;
  private readonly ajv: Ajv;
  private systemMessage?: string;
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 1000;

  /**
   * Creates an instance of OpenRouterService
   * @param apiKey - OpenRouter API key (from environment variable)
   * @param options - Optional configuration
   */
  constructor(apiKey: string, options?: OpenRouterServiceOptions) {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("API key is required for OpenRouterService");
    }

    this.apiKey = apiKey;
    this.baseUrl = options?.baseUrl || "https://openrouter.ai/api/v1";
    this.model = options?.defaultModel || "openai/gpt-4o-mini";
    this.timeoutMs = options?.timeoutMs || 30000;

    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeoutMs,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://flashcard-generator.local", // Optional - for rankings
        "X-Title": "Flashcard Generator", // Optional - for rankings
      },
    });

    // Initialize AJV for JSON Schema validation
    this.ajv = new Ajv({
      strict: true,
      allErrors: true,
    });
  }

  /**
   * Sets the global system message for all chat completions
   * @param content - System message content
   */
  public setSystemMessage(content: string): void {
    this.systemMessage = content;
  }

  /**
   * Changes the default model used for chat completions
   * @param modelName - Name of the model (e.g., "gpt-4")
   */
  public setModel(modelName: string): void {
    if (!modelName || modelName.trim() === "") {
      throw new Error("Model name cannot be empty");
    }
    this.model = modelName;
  }

  /**
   * Sends a chat completion request to OpenRouter API
   * @param messages - Array of chat messages with roles and content
   * @param options - Optional parameters for the request
   * @returns Parsed and validated response from the API
   */
  public async sendChatCompletion(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<any> {
    // Validate input
    if (!messages || messages.length === 0) {
      throw new Error("Messages array cannot be empty");
    }

    // Prepend system message if set
    const allMessages = this.systemMessage
      ? [{ role: "system" as MessageRole, content: this.systemMessage }, ...messages]
      : messages;

    // Build payload
    const payload = this.buildPayload(allMessages, options);

    // Execute request with retry logic
    const response = await this.executeRequest(payload);

    // Parse response
    const parsedResponse = this.parseResponse(response);

    // Validate response format if schema is provided
    if (options?.responseFormat) {
      this.validateResponseFormat(parsedResponse, options.responseFormat);
    }

    return parsedResponse;
  }

  /**
   * Builds the request payload for OpenRouter API
   * @param messages - Chat messages
   * @param options - Optional parameters
   * @returns Request payload object
   */
  private buildPayload(messages: ChatMessage[], options?: ChatCompletionOptions): Record<string, any> {
    const payload: Record<string, any> = {
      model: options?.model || this.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    // Add optional parameters
    if (options?.parameters) {
      Object.assign(payload, options.parameters);
    }

    // Add response format if specified
    if (options?.responseFormat) {
      payload.response_format = options.responseFormat;
    }

    return payload;
  }

  /**
   * Executes HTTP request with retry logic and error handling
   * @param payload - Request payload
   * @returns API response data
   */
  private async executeRequest(payload: Record<string, any>): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.httpClient.post("/chat/completions", payload);
        return response.data;
      } catch (error) {
        lastError = await this.handleError(error, attempt);

        // If error is non-retryable, throw immediately
        if (
          lastError instanceof OpenRouterAuthError ||
          lastError instanceof OpenRouterSchemaValidationError ||
          lastError instanceof OpenRouterResponseParseError
        ) {
          throw lastError;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelayMs * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    throw lastError || new Error("Request failed after maximum retries");
  }

  /**
   * Handles errors from API requests
   * @param error - Error object from axios or other sources
   * @param attempt - Current retry attempt number
   * @returns Typed error for better handling
   */
  private async handleError(error: unknown, attempt: number): Promise<Error> {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Network errors (timeout, DNS, connection refused)
      if (!axiosError.response) {
        console.error(`Network error on attempt ${attempt + 1}:`, axiosError.message);
        return new OpenRouterNetworkError(`Network error: ${axiosError.message || "Unknown network error"}`);
      }

      const status = axiosError.response.status;
      const responseData = axiosError.response.data as any;

      // 401 Unauthorized - invalid API key
      if (status === 401) {
        console.error("Authentication failed: Invalid API key");
        return new OpenRouterAuthError("Invalid API key");
      }

      // 429 Rate Limit
      if (status === 429) {
        const retryAfter = this.getRetryAfter(axiosError.response.headers);
        console.warn(`Rate limit hit on attempt ${attempt + 1}. Retry after: ${retryAfter}ms`);

        if (retryAfter > 0) {
          await this.sleep(retryAfter);
        }

        return new OpenRouterRateLimitError("Rate limit exceeded", retryAfter);
      }

      // 5xx Server errors
      if (status >= 500) {
        console.error(`Server error ${status} on attempt ${attempt + 1}:`, responseData);
        return new Error(`Server error: ${status} - ${responseData?.error?.message || "Unknown server error"}`);
      }

      // Other HTTP errors
      return new Error(`HTTP error ${status}: ${responseData?.error?.message || axiosError.message}`);
    }

    // Non-axios errors
    if (error instanceof Error) {
      return error;
    }

    return new Error("Unknown error occurred");
  }

  /**
   * Extracts retry-after header value in milliseconds
   * @param headers - Response headers
   * @returns Retry delay in milliseconds
   */
  private getRetryAfter(headers: Record<string, any>): number {
    const retryAfter = headers["retry-after"];
    if (!retryAfter) {
      return 0;
    }

    // If it's a number of seconds
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000;
    }

    // If it's a date string
    const retryDate = new Date(retryAfter);
    if (!isNaN(retryDate.getTime())) {
      return Math.max(0, retryDate.getTime() - Date.now());
    }

    return 0;
  }

  /**
   * Parses the response from OpenRouter API
   * @param response - Raw API response
   * @returns Parsed content from the response
   */
  private parseResponse(response: any): any {
    try {
      // Validate response structure
      if (!response || !response.choices || response.choices.length === 0) {
        throw new OpenRouterResponseParseError("Invalid response structure: no choices found");
      }

      const firstChoice = response.choices[0];
      if (!firstChoice.message || !firstChoice.message.content) {
        throw new OpenRouterResponseParseError("Invalid response structure: no message content found");
      }

      const content = firstChoice.message.content;

      // Try to parse as JSON if it looks like JSON
      if (typeof content === "string" && content.trim().startsWith("{")) {
        try {
          return JSON.parse(content);
        } catch (parseError) {
          throw new OpenRouterResponseParseError(
            `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
          );
        }
      }

      return content;
    } catch (error) {
      if (error instanceof OpenRouterResponseParseError) {
        throw error;
      }
      throw new OpenRouterResponseParseError(
        `Error parsing response: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Validates response against JSON schema
   * @param data - Parsed response data
   * @param responseFormat - Response format with JSON schema
   */
  private validateResponseFormat(data: any, responseFormat: ResponseFormat): void {
    try {
      const schema = responseFormat.json_schema.schema;
      const validate: ValidateFunction = this.ajv.compile(schema);

      const valid = validate(data);

      if (!valid) {
        const errors = validate.errors || [];
        console.error("Schema validation errors:", errors);
        throw new OpenRouterSchemaValidationError("Response does not match expected schema", errors);
      }
    } catch (error) {
      if (error instanceof OpenRouterSchemaValidationError) {
        throw error;
      }
      throw new OpenRouterSchemaValidationError(
        `Schema validation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Sleep utility for retry delays
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
