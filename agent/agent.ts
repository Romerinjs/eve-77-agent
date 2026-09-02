import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { defineAgent } from "eve";
import { warmKnowledgeCache } from "./lib/knowledge.js";

// Pre-cargar el índice de documentos MDX en memoria RAM
warmKnowledgeCache().catch((err) => {
  console.error("Error pre-cargando el índice de conocimiento:", err);
});

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  process.env.GOOGLE_AI_API_KEY;

function resolveModel() {
  if (apiKey) {
    const google = createGoogleGenerativeAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    return google(modelName);
  }
  return process.env.AI_MODEL || "openai/gpt-4o";
}

export default defineAgent({
  model: resolveModel(),
});
