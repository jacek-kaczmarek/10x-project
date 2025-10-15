/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { FlashcardProposalDTO, CreateGenerationResponseDTO } from "../../types";
import { OPENROUTER_CONFIG, FLASHCARD_GENERATION_PARAMS } from "../config/openrouter.config";
import { FLASHCARD_PROPOSALS_SCHEMA, FLASHCARD_GENERATION_SYSTEM_MESSAGE } from "../config/flashcard-schema.config";

// Mock Supabase client before importing GenerationService
vi.mock("../../db/supabase.client", () => ({
  supabaseClient: {
    from: vi.fn(),
  },
}));

// Mock crypto module
vi.mock("crypto", () => {
  const mockCreateHash = vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(() => "mocked-hash-value"),
    })),
  }));

  return {
    default: {
      createHash: mockCreateHash,
    },
    createHash: mockCreateHash,
  };
});

// Import after mocks are set up
import { GenerationService } from "./generation.service";
import { OpenRouterService } from "./openrouter.service";
import type { SupabaseClient } from "../../db/supabase.client";

describe("GenerationService", () => {
  let generationService: GenerationService;
  let mockSupabaseClient: SupabaseClient;
  let mockOpenRouterService: OpenRouterService;

  const mockUserId = "test-user-123";
  const mockSourceText = "This is a test source text for generating flashcards.";
  const mockFlashcards: FlashcardProposalDTO[] = Array.from({ length: 10 }, (_, i) => ({
    front: `Question ${i + 1}`,
    back: `Answer ${i + 1}`,
  }));

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabaseClient = {
      from: vi.fn(),
    } as unknown as SupabaseClient;

    // Create mock OpenRouter service
    mockOpenRouterService = {
      setSystemMessage: vi.fn(),
      setModel: vi.fn(),
      sendChatCompletion: vi.fn(),
    } as unknown as OpenRouterService;

    // Initialize service
    generationService = new GenerationService(mockSupabaseClient, mockOpenRouterService);
  });

  describe("constructor", () => {
    it("should set system message on OpenRouter service", () => {
      expect(mockOpenRouterService.setSystemMessage).toHaveBeenCalledWith(FLASHCARD_GENERATION_SYSTEM_MESSAGE);
    });

    it("should set AI model on OpenRouter service", () => {
      expect(mockOpenRouterService.setModel).toHaveBeenCalledWith(OPENROUTER_CONFIG.DEFAULT_MODEL);
    });
  });

  describe("createGeneration", () => {
    const mockGenerationRecord = {
      id: "gen-123",
      model: OPENROUTER_CONFIG.DEFAULT_MODEL,
      source_text_length: mockSourceText.length,
      source_text_hash: "mocked-hash-value",
      flashcards_generated: 10,
      created_at: "2024-01-01T00:00:00Z",
      user_id: mockUserId,
    };

    beforeEach(() => {
      // Mock successful AI generation
      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue({
        flashcards: mockFlashcards,
      });

      // Mock successful database insert
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockGenerationRecord,
            error: null,
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockInsert,
      } as any);
    });

    it("should successfully create generation with flashcard proposals", async () => {
      const result = await generationService.createGeneration(mockSourceText, mockUserId);

      expect(result).toEqual<CreateGenerationResponseDTO>({
        generation_id: mockGenerationRecord.id,
        model: mockGenerationRecord.model,
        source_text_length: mockGenerationRecord.source_text_length,
        source_text_hash: mockGenerationRecord.source_text_hash,
        flashcards_generated: mockGenerationRecord.flashcards_generated,
        created_at: mockGenerationRecord.created_at,
        proposals: mockFlashcards,
      });
    });

    it("should call OpenRouter service with correct parameters", async () => {
      await generationService.createGeneration(mockSourceText, mockUserId);

      expect(mockOpenRouterService.sendChatCompletion).toHaveBeenCalledWith(
        [
          {
            role: "user",
            content: expect.stringContaining(mockSourceText),
          },
        ],
        {
          responseFormat: FLASHCARD_PROPOSALS_SCHEMA,
          parameters: {
            temperature: FLASHCARD_GENERATION_PARAMS.temperature,
            max_tokens: FLASHCARD_GENERATION_PARAMS.max_tokens,
          },
        }
      );
    });

    it("should insert generation record into database with correct data", async () => {
      await generationService.createGeneration(mockSourceText, mockUserId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("generations");

      const insertCall = (mockSupabaseClient.from as any).mock.results[0].value.insert;
      expect(insertCall).toHaveBeenCalledWith({
        model: OPENROUTER_CONFIG.DEFAULT_MODEL,
        source_text_length: mockSourceText.length,
        source_text_hash: "mocked-hash-value",
        flashcards_generated: 10,
        user_id: mockUserId,
      });
    });

    it("should throw error when AI generation fails", async () => {
      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockRejectedValue(new Error("API Error"));

      // Mock error log insertion
      const mockErrorLogInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockErrorLogInsert,
      } as any);

      await expect(generationService.createGeneration(mockSourceText, mockUserId)).rejects.toThrow();
    });

    it("should throw error when database insert fails", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockInsert,
      } as any);

      await expect(generationService.createGeneration(mockSourceText, mockUserId)).rejects.toThrow(
        "Failed to insert generation record"
      );
    });

    it("should throw error when AI returns invalid response structure", async () => {
      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue({
        invalidKey: "invalid",
      });

      // Mock error log insertion
      const mockErrorLogInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockErrorLogInsert,
      } as any);

      await expect(generationService.createGeneration(mockSourceText, mockUserId)).rejects.toThrow(
        "Invalid response structure from AI service"
      );
    });

    it("should throw error when AI returns wrong number of flashcards", async () => {
      const wrongNumberOfFlashcards = [{ front: "Q1", back: "A1" }]; // Only 1 instead of 10

      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue({
        flashcards: wrongNumberOfFlashcards,
      });

      // Mock error log insertion
      const mockErrorLogInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockErrorLogInsert,
      } as any);

      await expect(generationService.createGeneration(mockSourceText, mockUserId)).rejects.toThrow(
        "Expected 10 flashcards, received 1"
      );
    });

    it("should log error to database when generation fails", async () => {
      const testError = new Error("Test error");
      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockRejectedValue(testError);

      // Mock error log insertion
      const mockErrorLogInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockErrorLogInsert,
      } as any);

      await expect(generationService.createGeneration(mockSourceText, mockUserId)).rejects.toThrow();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("generation_error_logs");
      expect(mockErrorLogInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          error_type: "Error",
          error_message: expect.stringContaining("Test error"),
          source_text_length: mockSourceText.length,
          source_text_hash: "mocked-hash-value",
          model: OPENROUTER_CONFIG.DEFAULT_MODEL,
          user_id: mockUserId,
        })
      );
    });

    it("should not throw when error logging fails", async () => {
      const testError = new Error("Test error");
      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockRejectedValue(testError);

      // Mock error log insertion that fails
      const mockErrorLogInsert = vi.fn().mockResolvedValue({ data: null, error: { message: "Log insert failed" } });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockErrorLogInsert,
      } as any);

      // Should still throw the original error, not the logging error
      await expect(generationService.createGeneration(mockSourceText, mockUserId)).rejects.toThrow(
        "Failed to generate flashcards with AI"
      );
    });
  });

  describe("hash calculation", () => {
    it("should calculate consistent hash for same input", async () => {
      const mockGenerationRecord = {
        id: "gen-123",
        model: OPENROUTER_CONFIG.DEFAULT_MODEL,
        source_text_length: mockSourceText.length,
        source_text_hash: "mocked-hash-value",
        flashcards_generated: 10,
        created_at: "2024-01-01T00:00:00Z",
        user_id: mockUserId,
      };

      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue({
        flashcards: mockFlashcards,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockGenerationRecord,
            error: null,
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockInsert,
      } as any);

      const result1 = await generationService.createGeneration(mockSourceText, mockUserId);
      const result2 = await generationService.createGeneration(mockSourceText, mockUserId);

      expect(result1.source_text_hash).toBe(result2.source_text_hash);
    });
  });

  describe("edge cases", () => {
    it("should handle empty flashcards array from AI", async () => {
      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue({
        flashcards: [],
      });

      const mockErrorLogInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockErrorLogInsert,
      } as any);

      await expect(generationService.createGeneration(mockSourceText, mockUserId)).rejects.toThrow(
        "Expected 10 flashcards, received 0"
      );
    });

    it("should handle non-Error exceptions in error logging", async () => {
      const nonErrorException = "String error";
      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockRejectedValue(nonErrorException);

      const mockErrorLogInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockErrorLogInsert,
      } as any);

      await expect(generationService.createGeneration(mockSourceText, mockUserId)).rejects.toThrow();

      expect(mockErrorLogInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          error_type: "Error",
          error_message: expect.stringContaining("Unknown error"),
        })
      );
    });

    it("should handle very long source text", async () => {
      const longText = "a".repeat(10000);
      const mockGenerationRecord = {
        id: "gen-123",
        model: OPENROUTER_CONFIG.DEFAULT_MODEL,
        source_text_length: longText.length,
        source_text_hash: "mocked-hash-value",
        flashcards_generated: 10,
        created_at: "2024-01-01T00:00:00Z",
        user_id: mockUserId,
      };

      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue({
        flashcards: mockFlashcards,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockGenerationRecord,
            error: null,
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await generationService.createGeneration(longText, mockUserId);

      expect(result.source_text_length).toBe(10000);
    });
  });
});
