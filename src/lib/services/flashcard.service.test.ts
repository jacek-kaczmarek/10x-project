/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { FlashcardService } from "./flashcard.service";
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  SaveFlashcardProposalsCommand,
  CreateManualFlashcardCommand,
  UpdateFlashcardCommand,
  ListFlashcardsQueryParamsDTO,
  FlashcardDTO,
} from "../../types";

// Mock Supabase client
vi.mock("../../db/supabase.client", () => ({
  supabaseClient: {
    from: vi.fn(),
  },
}));

describe("FlashcardService", () => {
  let flashcardService: FlashcardService;
  let mockSupabaseClient: SupabaseClient;

  const mockUserId = "test-user-123";
  const mockGenerationId = "gen-123";
  const mockFlashcardId = "flashcard-123";

  const mockFlashcard: FlashcardDTO = {
    id: mockFlashcardId,
    user_id: mockUserId,
    generation_id: mockGenerationId,
    front: "Test Question",
    back: "Test Answer",
    status: "active",
    source: "ai",
    due_date: "2024-01-01T00:00:00Z",
    interval: 0,
    ease_factor: 2.5,
    repetitions: 0,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabaseClient = {
      from: vi.fn(),
    } as unknown as SupabaseClient;

    // Initialize service
    flashcardService = new FlashcardService(mockSupabaseClient);
  });

  describe("saveProposals", () => {
    const mockCommand: SaveFlashcardProposalsCommand = {
      generation_id: mockGenerationId,
      proposals: [
        { front: "Question 1", back: "Answer 1", was_edited: false },
        { front: "Question 2", back: "Answer 2", was_edited: true },
      ],
    };

    it("should successfully save flashcard proposals", async () => {
      // Mock generation exists check
      const mockGenerationSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: mockGenerationId },
            error: null,
          }),
        }),
      });

      // Mock flashcard insert
      const mockFlashcardsInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            { ...mockFlashcard, front: "Question 1", source: "ai" },
            { ...mockFlashcard, front: "Question 2", source: "ai-edited" },
          ],
          error: null,
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockImplementation((table: string) => {
        if (table === "generations") {
          return { select: mockGenerationSelect } as any;
        }
        if (table === "flashcards") {
          return { insert: mockFlashcardsInsert } as any;
        }
        return {} as any;
      });

      const result = await flashcardService.saveProposals(mockCommand, mockUserId);

      expect(result.saved_count).toBe(2);
      expect(result.flashcards).toHaveLength(2);
      expect(result.flashcards[0].source).toBe("ai");
      expect(result.flashcards[1].source).toBe("ai-edited");
    });

    it("should throw NOT_FOUND when generation does not exist", async () => {
      // Mock generation not found
      const mockGenerationSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Not found" },
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        select: mockGenerationSelect,
      } as any);

      await expect(flashcardService.saveProposals(mockCommand, mockUserId)).rejects.toThrow("NOT_FOUND");
    });

    it("should throw DATABASE_ERROR when insert fails", async () => {
      // Mock generation exists
      const mockGenerationSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: mockGenerationId },
            error: null,
          }),
        }),
      });

      // Mock insert failure
      const mockFlashcardsInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Insert failed" },
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockImplementation((table: string) => {
        if (table === "generations") {
          return { select: mockGenerationSelect } as any;
        }
        if (table === "flashcards") {
          return { insert: mockFlashcardsInsert } as any;
        }
        return {} as any;
      });

      await expect(flashcardService.saveProposals(mockCommand, mockUserId)).rejects.toThrow("DATABASE_ERROR");
    });
  });

  describe("listFlashcards", () => {
    const mockQuery: ListFlashcardsQueryParamsDTO = {
      status: "active",
      page: 1,
      limit: 20,
      sort: "created_at",
      order: "desc",
    };

    it("should successfully list flashcards with pagination", async () => {
      const mockFlashcards = [mockFlashcard, { ...mockFlashcard, id: "flashcard-456" }];

      // Mock query builder chain
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockFlashcards,
          error: null,
          count: 2,
        }),
      };

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue(mockQueryBuilder as any);

      const result = await flashcardService.listFlashcards(mockQuery, mockUserId);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total_pages).toBe(1);
    });

    it("should apply search filter", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [mockFlashcard],
          error: null,
          count: 1,
        }),
      };

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue(mockQueryBuilder as any);

      await flashcardService.listFlashcards({ ...mockQuery, search: "test" }, mockUserId);

      expect(mockQueryBuilder.or).toHaveBeenCalledWith("front.ilike.%test%,back.ilike.%test%");
    });

    it("should apply due filter", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [mockFlashcard],
          error: null,
          count: 1,
        }),
      };

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue(mockQueryBuilder as any);

      await flashcardService.listFlashcards({ ...mockQuery, due: true }, mockUserId);

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("status", "active");
      expect(mockQueryBuilder.lte).toHaveBeenCalled();
    });

    it("should throw DATABASE_ERROR on query failure", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Query failed" },
          count: null,
        }),
      };

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue(mockQueryBuilder as any);

      await expect(flashcardService.listFlashcards(mockQuery, mockUserId)).rejects.toThrow("DATABASE_ERROR");
    });
  });

  describe("createManualFlashcard", () => {
    const mockCommand: CreateManualFlashcardCommand = {
      front: "Manual Question",
      back: "Manual Answer",
    };

    it("should successfully create manual flashcard", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              ...mockFlashcard,
              front: "Manual Question",
              back: "Manual Answer",
              source: "manual",
              generation_id: null,
            },
            error: null,
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await flashcardService.createManualFlashcard(mockCommand, mockUserId);

      expect(result.source).toBe("manual");
      expect(result.generation_id).toBeNull();
      expect(result.front).toBe("Manual Question");
    });

    it("should throw DATABASE_ERROR on insert failure", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Insert failed" },
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        insert: mockInsert,
      } as any);

      await expect(flashcardService.createManualFlashcard(mockCommand, mockUserId)).rejects.toThrow("DATABASE_ERROR");
    });
  });

  describe("getFlashcard", () => {
    it("should successfully get a flashcard", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockFlashcard,
              error: null,
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await flashcardService.getFlashcard(mockFlashcardId, mockUserId);

      expect(result).toEqual(mockFlashcard);
    });

    it("should return null when flashcard not found", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await flashcardService.getFlashcard(mockFlashcardId, mockUserId);

      expect(result).toBeNull();
    });

    it("should throw DATABASE_ERROR on query failure", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "ERROR", message: "Query failed" },
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(flashcardService.getFlashcard(mockFlashcardId, mockUserId)).rejects.toThrow("DATABASE_ERROR");
    });
  });

  describe("updateFlashcard", () => {
    const mockCommand: UpdateFlashcardCommand = {
      front: "Updated Question",
      back: "Updated Answer",
    };

    it("should successfully update flashcard", async () => {
      // Mock get flashcard
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockFlashcard,
              error: null,
            }),
          }),
        }),
      });

      // Mock update
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockFlashcard, ...mockCommand },
                error: null,
              }),
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockImplementation(() => {
        return {
          select: mockSelect,
          update: mockUpdate,
        } as any;
      });

      const result = await flashcardService.updateFlashcard(mockFlashcardId, mockCommand, mockUserId);

      expect(result.front).toBe("Updated Question");
      expect(result.back).toBe("Updated Answer");
    });

    it("should auto-change source to ai-edited when content edited", async () => {
      // Mock get flashcard with source 'ai'
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockFlashcard, source: "ai" },
              error: null,
            }),
          }),
        }),
      });

      // Mock update
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockFlashcard, ...mockCommand, source: "ai-edited" },
                error: null,
              }),
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockImplementation(() => {
        return {
          select: mockSelect,
          update: mockUpdate,
        } as any;
      });

      const result = await flashcardService.updateFlashcard(mockFlashcardId, mockCommand, mockUserId);

      expect(result.source).toBe("ai-edited");
    });

    it("should throw NOT_FOUND when flashcard does not exist", async () => {
      // Mock flashcard not found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(flashcardService.updateFlashcard(mockFlashcardId, mockCommand, mockUserId)).rejects.toThrow(
        "NOT_FOUND"
      );
    });

    it("should throw DATABASE_ERROR on update failure", async () => {
      // Mock get flashcard success
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockFlashcard,
              error: null,
            }),
          }),
        }),
      });

      // Mock update failure
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Update failed" },
              }),
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockImplementation(() => {
        return {
          select: mockSelect,
          update: mockUpdate,
        } as any;
      });

      await expect(flashcardService.updateFlashcard(mockFlashcardId, mockCommand, mockUserId)).rejects.toThrow(
        "DATABASE_ERROR"
      );
    });
  });

  describe("deleteFlashcard", () => {
    it("should successfully delete flashcard", async () => {
      // Mock get flashcard
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockFlashcard,
              error: null,
            }),
          }),
        }),
      });

      // Mock delete
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockImplementation(() => {
        return {
          select: mockSelect,
          delete: mockDelete,
        } as any;
      });

      await expect(flashcardService.deleteFlashcard(mockFlashcardId, mockUserId)).resolves.not.toThrow();
    });

    it("should throw NOT_FOUND when flashcard does not exist", async () => {
      // Mock flashcard not found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(flashcardService.deleteFlashcard(mockFlashcardId, mockUserId)).rejects.toThrow("NOT_FOUND");
    });

    it("should throw DATABASE_ERROR on delete failure", async () => {
      // Mock get flashcard success
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockFlashcard,
              error: null,
            }),
          }),
        }),
      });

      // Mock delete failure
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: "Delete failed" },
          }),
        }),
      });

      vi.spyOn(mockSupabaseClient, "from").mockImplementation(() => {
        return {
          select: mockSelect,
          delete: mockDelete,
        } as any;
      });

      await expect(flashcardService.deleteFlashcard(mockFlashcardId, mockUserId)).rejects.toThrow("DATABASE_ERROR");
    });
  });
});
