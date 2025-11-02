// src/lib/services/flashcard.service.ts
import { type SupabaseClient } from "../../db/supabase.client";
import type {
  SaveFlashcardProposalsCommand,
  SaveFlashcardProposalsResponseDTO,
  FlashcardInsert,
  FlashcardDTO,
  ListFlashcardsResponseDTO,
  ListFlashcardsQueryParamsDTO,
  CreateManualFlashcardCommand,
  UpdateFlashcardCommand,
} from "../../types";

/**
 * Service for managing flashcards
 */
export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Save AI-generated flashcard proposals in batch
   *
   * @param command - Command containing generation_id and proposals to save
   * @param userId - The ID of the authenticated user
   * @returns Response with saved count and full flashcard entities
   * @throws Error if generation_id doesn't exist or database operation fails
   */
  async saveProposals(
    command: SaveFlashcardProposalsCommand,
    userId: string
  ): Promise<SaveFlashcardProposalsResponseDTO> {
    const { generation_id, proposals } = command;

    // Step 1: Verify that generation_id exists
    const { data: generation, error: generationError } = await this.supabase
      .from("generations")
      .select("id")
      .eq("id", generation_id)
      .single();

    if (generationError || !generation) {
      throw new Error("NOT_FOUND");
    }

    // Step 2: Map proposals to FlashcardInsert objects
    const now = new Date().toISOString();
    const flashcardsToInsert: FlashcardInsert[] = proposals.map((proposal) => ({
      generation_id,
      front: proposal.front.trim(),
      back: proposal.back.trim(),
      source: proposal.was_edited ? "ai-edited" : "ai",
      status: "active",
      due_date: now,
      interval: 0,
      ease_factor: 2.5,
      repetitions: 0,
      user_id: userId,
    }));

    // Step 3: Execute batch insert
    const { data: insertedFlashcards, error: insertError } = await this.supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select();

    if (insertError) {
      throw new Error("DATABASE_ERROR");
    }

    if (!insertedFlashcards || insertedFlashcards.length === 0) {
      throw new Error("DATABASE_ERROR");
    }

    // Step 4: Return response with saved count and full entities
    return {
      saved_count: insertedFlashcards.length,
      flashcards: insertedFlashcards as FlashcardDTO[],
    };
  }

  /**
   * List flashcards with filtering, searching, sorting, and pagination
   *
   * @param query - Query parameters for filtering and pagination
   * @param userId - The ID of the authenticated user
   * @returns Paginated list of flashcards
   * @throws Error if database operation fails
   */
  async listFlashcards(query: ListFlashcardsQueryParamsDTO, userId: string): Promise<ListFlashcardsResponseDTO> {
    // Step 1: Build base query with count
    let queryBuilder = this.supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", userId);

    // Step 2: Apply filters
    if (query.status && query.status !== "all") {
      queryBuilder = queryBuilder.eq("status", query.status);
    }

    if (query.source && query.source !== "all") {
      queryBuilder = queryBuilder.eq("source", query.source);
    }

    if (query.search) {
      queryBuilder = queryBuilder.or(`front.ilike.%${query.search}%,back.ilike.%${query.search}%`);
    }

    if (query.due) {
      const now = new Date().toISOString();
      queryBuilder = queryBuilder.eq("status", "active").lte("due_date", now).not("due_date", "is", null);
    }

    if (query.generation_id) {
      queryBuilder = queryBuilder.eq("generation_id", query.generation_id);
    }

    // Step 3: Apply sorting
    const sortField = query.sort || "created_at";
    const sortOrder = query.order === "asc";
    queryBuilder = queryBuilder.order(sortField, { ascending: sortOrder });

    // Step 4: Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    queryBuilder = queryBuilder.range(from, to);

    // Step 5: Execute query
    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error("DATABASE_ERROR");
    }

    // Step 6: Prepare response
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return {
      data: (data as FlashcardDTO[]) || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Create a manual flashcard
   *
   * @param command - Command with front and back text
   * @param userId - The ID of the authenticated user
   * @returns Created flashcard
   * @throws Error if database operation fails
   */
  async createManualFlashcard(command: CreateManualFlashcardCommand, userId: string): Promise<FlashcardDTO> {
    const now = new Date().toISOString();

    const flashcardToInsert: FlashcardInsert = {
      front: command.front.trim(),
      back: command.back.trim(),
      source: "manual",
      status: "active",
      due_date: now,
      interval: 0,
      ease_factor: 2.5,
      repetitions: 0,
      user_id: userId,
      generation_id: null,
    };

    const { data, error } = await this.supabase.from("flashcards").insert(flashcardToInsert).select().single();

    if (error) {
      throw new Error("DATABASE_ERROR");
    }

    if (!data) {
      throw new Error("DATABASE_ERROR");
    }

    return data as FlashcardDTO;
  }

  /**
   * Get a single flashcard by ID
   *
   * @param flashcardId - The flashcard ID
   * @param userId - The ID of the authenticated user
   * @returns The flashcard or null if not found
   * @throws Error if database operation fails
   */
  async getFlashcard(flashcardId: string, userId: string): Promise<FlashcardDTO | null> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      throw new Error("DATABASE_ERROR");
    }

    return data as FlashcardDTO;
  }

  /**
   * Update a flashcard
   *
   * @param flashcardId - The flashcard ID
   * @param command - Update command with optional fields
   * @param userId - The ID of the authenticated user
   * @returns Updated flashcard
   * @throws Error if flashcard not found or database operation fails
   */
  async updateFlashcard(flashcardId: string, command: UpdateFlashcardCommand, userId: string): Promise<FlashcardDTO> {
    // Step 1: Check if flashcard exists and belongs to user
    const existing = await this.getFlashcard(flashcardId, userId);
    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    // Step 2: Auto-change source if content is edited and source is 'ai'
    let source = command.source;
    if (!source && (command.front || command.back) && existing.source === "ai") {
      source = "ai-edited";
    }

    // Step 3: Build update object (only include provided fields)
    const updateData: Partial<FlashcardDTO> = {};
    if (command.front !== undefined) updateData.front = command.front.trim();
    if (command.back !== undefined) updateData.back = command.back.trim();
    if (command.status !== undefined) updateData.status = command.status;
    if (source !== undefined) updateData.source = source;
    if (command.due_date !== undefined) updateData.due_date = command.due_date;
    if (command.interval !== undefined) updateData.interval = command.interval;
    if (command.ease_factor !== undefined) updateData.ease_factor = command.ease_factor;
    if (command.repetitions !== undefined) updateData.repetitions = command.repetitions;

    // Step 4: Execute update
    const { data, error } = await this.supabase
      .from("flashcards")
      .update(updateData)
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error("DATABASE_ERROR");
    }

    if (!data) {
      throw new Error("DATABASE_ERROR");
    }

    return data as FlashcardDTO;
  }

  /**
   * Delete a flashcard (hard delete)
   *
   * @param flashcardId - The flashcard ID
   * @param userId - The ID of the authenticated user
   * @throws Error if flashcard not found or database operation fails
   */
  async deleteFlashcard(flashcardId: string, userId: string): Promise<void> {
    // Step 1: Check if flashcard exists and belongs to user
    const existing = await this.getFlashcard(flashcardId, userId);
    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    // Step 2: Execute delete
    const { error } = await this.supabase.from("flashcards").delete().eq("id", flashcardId).eq("user_id", userId);

    if (error) {
      throw new Error("DATABASE_ERROR");
    }
  }
}
