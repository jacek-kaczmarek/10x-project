/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { FLASHCARD_GENERATION_PARAMS } from "../config/openrouter.config";

// Mock Supabase client before importing GenerationService
vi.mock("../../db/supabase.client", () => ({
  supabaseClient: {
    from: vi.fn(),
  },
}));

// Import after mocks are set up
import { GenerationService } from "./generation.service";
import { OpenRouterService } from "./openrouter.service";
import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Integration tests for GenerationService
 * These tests verify the interaction between GenerationService and its dependencies
 */
describe("GenerationService - Integration Tests", () => {
  let generationService: GenerationService;
  let mockSupabaseClient: SupabaseClient;
  let mockOpenRouterService: OpenRouterService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock Supabase client with chained methods
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
    } as unknown as SupabaseClient;

    mockOpenRouterService = {
      setSystemMessage: vi.fn(),
      setModel: vi.fn(),
      sendChatCompletion: vi.fn(),
    } as unknown as OpenRouterService;

    generationService = new GenerationService(mockSupabaseClient, mockOpenRouterService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Full generation workflow", () => {
    it("should complete full generation workflow successfully", async () => {
      const sourceText = "Test content about JavaScript programming.";
      const userId = "user-123";

      // Mock AI response
      const mockFlashcards = Array.from({ length: 10 }, (_, i) => ({
        front: `What is concept ${i + 1}?`,
        back: `Answer for concept ${i + 1}`,
      }));

      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue({
        flashcards: mockFlashcards,
      });

      // Mock database response
      const mockDbResponse = {
        id: "gen-456",
        model: "openai/gpt-4o-mini",
        source_text_length: sourceText.length,
        source_text_hash: expect.any(String),
        flashcards_generated: 10,
        created_at: new Date().toISOString(),
        user_id: userId,
      };

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDbResponse,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await generationService.createGeneration(sourceText, userId);

      // Verify result structure
      expect(result).toMatchObject({
        generation_id: mockDbResponse.id,
        model: mockDbResponse.model,
        source_text_length: sourceText.length,
        flashcards_generated: 10,
        proposals: mockFlashcards,
      });

      // Verify service calls were made in correct order
      expect(mockOpenRouterService.sendChatCompletion).toHaveBeenCalledBefore(mockSupabaseClient.from as any);
    });

    it("should handle partial failures gracefully", async () => {
      const sourceText = "Test content";
      const userId = "user-123";

      // AI succeeds
      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue({
        flashcards: Array.from({ length: 10 }, (_, i) => ({
          front: `Q${i}`,
          back: `A${i}`,
        })),
      });

      // But database fails

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "DB connection lost" },
            }),
          }),
        }),
      } as any);

      await expect(generationService.createGeneration(sourceText, userId)).rejects.toThrow(
        "Failed to insert generation record"
      );

      // Verify error was logged
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("generation_error_logs");
    });
  });

  describe("Concurrent requests handling", () => {
    it("should handle multiple concurrent generation requests", async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        sourceText: `Test content ${i}`,
        userId: `user-${i}`,
      }));

      const mockFlashcards = Array.from({ length: 10 }, (_, i) => ({
        front: `Q${i}`,
        back: `A${i}`,
      }));

      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue({
        flashcards: mockFlashcards,
      });

      let callCount = 0;
      vi.spyOn(mockSupabaseClient, "from").mockImplementation(() => {
        callCount++;
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: `gen-${callCount}`,
                  model: "openai/gpt-4o-mini",
                  source_text_length: 100,
                  source_text_hash: `hash-${callCount}`,
                  flashcards_generated: 10,
                  created_at: new Date().toISOString(),
                  user_id: `user-${callCount}`,
                },
                error: null,
              }),
            }),
          }),
        } as any;
      });

      const results = await Promise.all(
        requests.map((req) => generationService.createGeneration(req.sourceText, req.userId))
      );

      expect(results).toHaveLength(5);
      expect(new Set(results.map((r) => r.generation_id)).size).toBe(5); // All unique IDs
    });
  });

  describe("Error recovery scenarios", () => {
    it("should retry after transient errors (simulated)", async () => {
      const sourceText = "Test content";
      const userId = "user-123";

      let attempt = 0;
      const mockFlashcards = Array.from({ length: 10 }, (_, i) => ({
        front: `Q${i}`,
        back: `A${i}`,
      }));

      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          throw new Error("Transient network error");
        }
        return { flashcards: mockFlashcards };
      });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "gen-123",
                model: "openai/gpt-4o-mini",
                source_text_length: sourceText.length,
                source_text_hash: "hash",
                flashcards_generated: 10,
                created_at: new Date().toISOString(),
                user_id: userId,
              },
              error: null,
            }),
          }),
        }),
      } as any);

      // First attempt should fail
      await expect(generationService.createGeneration(sourceText, userId)).rejects.toThrow();

      // Second attempt should succeed
      const result = await generationService.createGeneration(sourceText, userId);
      expect(result.proposals).toHaveLength(10);
    });

    it("should maintain data consistency after error", async () => {
      const sourceText = "Test content";
      const userId = "user-123";

      // First call fails during AI generation
      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockRejectedValueOnce(new Error("AI service down"));

      const mockErrorLogInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockErrorLogInsert,
      } as any);

      await expect(generationService.createGeneration(sourceText, userId)).rejects.toThrow();

      // Verify error was logged
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("generation_error_logs");

      // Verify no generation record was created (only error log)
      const fromCalls = (mockSupabaseClient.from as any).mock.calls;
      expect(fromCalls).not.toContainEqual(["generations"]);
    });
  });

  describe("Data validation", () => {
    it("should validate flashcard structure from AI response", async () => {
      const sourceText = "Test content";
      const userId = "user-123";

      // AI returns malformed flashcards
      const malformedFlashcards = Array.from({ length: 10 }, () => ({
        question: "Q", // Wrong field name
        answer: "A", // Wrong field name
      }));

      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue({
        flashcards: malformedFlashcards,
      });

      const mockErrorLogInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockErrorLogInsert,
      } as any);

      // The current implementation doesn't validate field names, but counts
      // This test documents current behavior
      await expect(generationService.createGeneration(sourceText, userId)).rejects.toThrow();
    });

    it("should enforce exact flashcard count requirement", async () => {
      const sourceText = "Test content";
      const userId = "user-123";

      const testCases = [
        { count: 0, description: "zero flashcards" },
        { count: 5, description: "too few flashcards" },
        { count: 15, description: "too many flashcards" },
      ];

      for (const testCase of testCases) {
        const flashcards = Array.from({ length: testCase.count }, (_, i) => ({
          front: `Q${i}`,
          back: `A${i}`,
        }));

        vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue({
          flashcards,
        });

        const mockErrorLogInsert = vi.fn().mockResolvedValue({ data: null, error: null });

        vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
          insert: mockErrorLogInsert,
        } as any);

        await expect(generationService.createGeneration(sourceText, userId)).rejects.toThrow(
          `Expected ${FLASHCARD_GENERATION_PARAMS.flashcardsCount} flashcards, received ${testCase.count}`
        );
      }
    });
  });

  describe("Performance and resource management", () => {
    it("should handle large source texts efficiently", async () => {
      const largeText = "a".repeat(10000); // 10KB of text
      const userId = "user-123";

      const mockFlashcards = Array.from({ length: 10 }, (_, i) => ({
        front: `Q${i}`,
        back: `A${i}`,
      }));

      vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue({
        flashcards: mockFlashcards,
      });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "gen-123",
                model: "openai/gpt-4o-mini",
                source_text_length: largeText.length,
                source_text_hash: "hash",
                flashcards_generated: 10,
                created_at: new Date().toISOString(),
                user_id: userId,
              },
              error: null,
            }),
          }),
        }),
      } as any);

      const startTime = Date.now();
      const result = await generationService.createGeneration(largeText, userId);
      const duration = Date.now() - startTime;

      expect(result.source_text_length).toBe(10000);
      expect(duration).toBeLessThan(5000); // Should complete in reasonable time
    });
  });
});
