import { http, HttpResponse } from "msw";
import type { RequestHandler } from "msw";

export const handlers: RequestHandler[] = [
  // Example handler - customize based on your API endpoints
  http.post("/api/flashcard-proposals/batch", () => {
    return HttpResponse.json({
      success: true,
      data: {
        proposals: [
          {
            id: "1",
            front: "Test Front",
            back: "Test Back",
            source: "ai_generated",
          },
        ],
      },
    });
  }),

  // Add more handlers as needed for your API endpoints
];
