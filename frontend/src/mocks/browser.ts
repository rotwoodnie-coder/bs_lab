import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

export async function enableMocking() {
  if (typeof window === "undefined") return;
  try {
    await worker.start({ onUnhandledRequest: "bypass" });
    console.info("[MSW] Mocking enabled.");
  } catch (error) {
    console.warn("[MSW] Mocking disabled.", error);
  }
}
