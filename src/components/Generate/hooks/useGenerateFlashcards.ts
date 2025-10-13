import { useState } from "react";
import type { CreateGenerationCommand, CreateGenerationResponseDTO } from "@/types";

export function useGenerateFlashcards() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateFlashcards = async (sourceText: string): Promise<CreateGenerationResponseDTO> => {
    setLoading(true);
    setProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const command: CreateGenerationCommand = {
        source_text: sourceText,
      };

      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Błąd generowania fiszek");
      }

      const data: CreateGenerationResponseDTO = await response.json();

      setProgress(100);

      // Keep 100% visible for a moment before completing
      await new Promise((resolve) => setTimeout(resolve, 300));

      return data;
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return {
    loading,
    progress,
    generateFlashcards,
  };
}
