import { bindHandlers } from "./bind";
import { authHandlers } from "./auth";
import { videoHandlers } from "./video";
import { quizHandlers } from "./quiz";

export const handlers = [...bindHandlers, ...authHandlers, ...videoHandlers, ...quizHandlers];
