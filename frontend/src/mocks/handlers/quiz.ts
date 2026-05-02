import { http, HttpResponse } from "msw";

export const quizHandlers = [
  http.post("/api/quiz/submitAnswer", async ({ request }) => {
    await request.text().catch(() => "");
    return HttpResponse.json({
      success: true,
      data: {
        total: 12,
        correct: 9,
        updated: true,
      },
      error: null,
    });
  }),
];
