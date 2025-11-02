// src/lib/services/openrouter.service.ts
import axios, { type AxiosInstance, type AxiosError } from "axios";
import { OPENROUTER_CONFIG } from "../config/openrouter.config";

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
 * OpenRouter API response structure
 */
interface OpenRouterResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

/**
 * Options for chat completion requests
 */
export interface ChatCompletionOptions {
  model?: string;
  parameters?: Record<string, unknown>;
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
    public validationErrors?: Record<string, unknown>[]
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
  private systemMessage?: string;
  private readonly maxRetries = OPENROUTER_CONFIG.RETRY.MAX_RETRIES;
  private readonly retryDelayMs = OPENROUTER_CONFIG.RETRY.INITIAL_DELAY_MS;

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
    this.baseUrl = options?.baseUrl || OPENROUTER_CONFIG.BASE_URL;
    this.model = options?.defaultModel || OPENROUTER_CONFIG.DEFAULT_MODEL;
    this.timeoutMs = options?.timeoutMs || OPENROUTER_CONFIG.TIMEOUT_MS;

    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeoutMs,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": OPENROUTER_CONFIG.HEADERS.HTTP_REFERER,
        "X-Title": OPENROUTER_CONFIG.HEADERS.X_TITLE,
      },
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
  public async sendChatCompletion(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<unknown> {
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
  private buildPayload(messages: ChatMessage[], options?: ChatCompletionOptions): Record<string, unknown> {
    const payload: Record<string, unknown> = {
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
  private async executeRequest(payload: Record<string, unknown>): Promise<unknown> {
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
      const responseData = axiosError.response.data as Record<string, unknown>;

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
        const errorMessage =
          (responseData?.error &&
          typeof responseData.error === "object" &&
          "message" in responseData.error &&
          typeof responseData.error.message === "string"
            ? responseData.error.message
            : null) || "Unknown server error";
        return new Error(`Server error: ${status} - ${errorMessage}`);
      }

      // Other HTTP errors
      const errorMessage =
        (responseData?.error &&
        typeof responseData.error === "object" &&
        "message" in responseData.error &&
        typeof responseData.error.message === "string"
          ? responseData.error.message
          : null) || axiosError.message;
      return new Error(`HTTP error ${status}: ${errorMessage}`);
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
  private getRetryAfter(headers: Record<string, string | string[] | undefined>): number {
    const retryAfter = headers["retry-after"];
    if (!retryAfter) {
      return 0;
    }

    // Handle array case (shouldn't happen but TypeScript requires it)
    const retryAfterValue = Array.isArray(retryAfter) ? retryAfter[0] : retryAfter;

    // If it's a number of seconds
    const seconds = parseInt(retryAfterValue, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000;
    }

    // If it's a date string
    const retryDate = new Date(retryAfterValue);
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
  private parseResponse(response: unknown): unknown {
    try {
      // Type guard for response structure
      const isOpenRouterResponse = (r: unknown): r is OpenRouterResponse => {
        return (
          typeof r === "object" &&
          r !== null &&
          "choices" in r &&
          Array.isArray((r as OpenRouterResponse).choices) &&
          (r as OpenRouterResponse).choices.length > 0
        );
      };

      // Validate response structure
      if (!isOpenRouterResponse(response)) {
        throw new OpenRouterResponseParseError("Invalid response structure: no choices found");
      }

      const firstChoice = response.choices[0];
      if (!firstChoice?.message?.content) {
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
   * Manual validation without code generation (Cloudflare Workers compatible)
   * @param data - Parsed response data
   * @param responseFormat - Response format with JSON schema
   */
  private validateResponseFormat(data: unknown, responseFormat: ResponseFormat): void {
    try {
      const schema = responseFormat.json_schema.schema;
      const errors: { path: string; message: string }[] = [];

      // Manual validation logic for our flashcard schema
      this.validateSchema(data, schema, "", errors);

      if (errors.length > 0) {
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
   * Recursive schema validator (Cloudflare Workers compatible)
   * @param data - Data to validate
   * @param schema - JSON schema definition
   * @param path - Current path in the data structure
   * @param errors - Array to collect validation errors
   */
  private validateSchema(
    data: unknown,
    schema: Record<string, unknown>,
    path: string,
    errors: { path: string; message: string }[]
  ): void {
    // Type validation
    const schemaType = schema.type as string | undefined;
    if (schemaType) {
      const actualType = Array.isArray(data) ? "array" : typeof data;
      if (actualType !== schemaType && data !== null) {
        errors.push({ path, message: `Expected type ${schemaType}, got ${actualType}` });
        return;
      }
    }

    // Object validation
    if (schemaType === "object" && typeof data === "object" && data !== null && !Array.isArray(data)) {
      const dataObj = data as Record<string, unknown>;
      const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
      const required = schema.required as string[] | undefined;
      const additionalProperties = schema.additionalProperties as boolean | undefined;

      // Check required properties
      if (required) {
        for (const prop of required) {
          if (!(prop in dataObj)) {
            errors.push({ path: `${path}.${prop}`, message: `Required property missing: ${prop}` });
          }
        }
      }

      // Validate properties
      if (properties) {
        for (const [prop, propSchema] of Object.entries(properties)) {
          if (prop in dataObj) {
            this.validateSchema(dataObj[prop], propSchema, `${path}.${prop}`, errors);
          }
        }
      }

      // Check for additional properties
      if (additionalProperties === false && properties) {
        const allowedProps = new Set(Object.keys(properties));
        for (const prop of Object.keys(dataObj)) {
          if (!allowedProps.has(prop)) {
            errors.push({ path: `${path}.${prop}`, message: `Additional property not allowed: ${prop}` });
          }
        }
      }
    }

    // Array validation
    if (schemaType === "array" && Array.isArray(data)) {
      const items = schema.items as Record<string, unknown> | undefined;
      const minItems = schema.minItems as number | undefined;
      const maxItems = schema.maxItems as number | undefined;

      // Check array length
      if (minItems !== undefined && data.length < minItems) {
        errors.push({ path, message: `Array must have at least ${minItems} items, got ${data.length}` });
      }
      if (maxItems !== undefined && data.length > maxItems) {
        errors.push({ path, message: `Array must have at most ${maxItems} items, got ${data.length}` });
      }

      // Validate each item
      if (items) {
        data.forEach((item, index) => {
          this.validateSchema(item, items, `${path}[${index}]`, errors);
        });
      }
    }

    // String validation
    if (schemaType === "string" && typeof data === "string") {
      const minLength = schema.minLength as number | undefined;
      const maxLength = schema.maxLength as number | undefined;

      if (minLength !== undefined && data.length < minLength) {
        errors.push({ path, message: `String must be at least ${minLength} characters, got ${data.length}` });
      }
      if (maxLength !== undefined && data.length > maxLength) {
        errors.push({ path, message: `String must be at most ${maxLength} characters, got ${data.length}` });
      }
    }

    // Number validation
    if (schemaType === "number" && typeof data === "number") {
      const minimum = schema.minimum as number | undefined;
      const maximum = schema.maximum as number | undefined;

      if (minimum !== undefined && data < minimum) {
        errors.push({ path, message: `Number must be at least ${minimum}, got ${data}` });
      }
      if (maximum !== undefined && data > maximum) {
        errors.push({ path, message: `Number must be at most ${maximum}, got ${data}` });
      }
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
