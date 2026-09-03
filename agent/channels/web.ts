import { createMemoryState } from "@chat-adapter/state-memory";
import { createWebAdapter } from "@chat-adapter/web";
import type { Message, Thread } from "chat";
import { chatSdkChannel } from "eve/channels/chat-sdk";
import { generateText, tool } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { searchKnowledge, warmKnowledgeCache } from "../lib/knowledge.js";

// Pre-cargar base de conocimiento en RAM
warmKnowledgeCache().catch((err) => {
  console.error("Error pre-cargando base de conocimiento:", err);
});

async function getApiKey(): Promise<string> {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (process.env.GOOGLE_AI_API_KEY) return process.env.GOOGLE_AI_API_KEY;

  try {
    const envContent = await readFile(path.resolve(process.cwd(), ".env"), "utf8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (key && rest.length > 0) {
        process.env[key.trim()] = rest.join("=").trim();
      }
    }
  } catch {
    // Si no hay .env
  }

  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    ""
  );
}

export const { bot, channel } = chatSdkChannel({
  userName: "77 Studio Assistant",
  adapters: {
    web: createWebAdapter({
      userName: "77 Studio Assistant",
      getUser: async (_req: Request) => {
        return {
          id: "anonymous-web-user",
          name: "Visitante Web",
        };
      },
    }),
  },
  state: createMemoryState(),
});

let cachedInstructions: string | null = null;
async function getInstructions() {
  if (!cachedInstructions) {
    try {
      cachedInstructions = await readFile(path.resolve(process.cwd(), "agent", "instructions.md"), "utf8");
    } catch {
      cachedInstructions = "Eres Eve, el consultor oficial de inteligencia artificial y crecimiento de 77 Studio.";
    }
  }
  return cachedInstructions;
}

bot.onDirectMessage(async (thread: Thread, message: Message) => {
  const apiKey = await getApiKey();
  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const google = createGoogleGenerativeAI({ apiKey });
  const instructions = await getInstructions();

  let turnMessages: any[] = [{ role: "user", content: message.text }];
  let finalResponseText = "";

  for (let turn = 1; turn <= 4; turn++) {
    const result = await generateText({
      model: google(modelName),
      system: instructions,
      messages: turnMessages,
      tools: {
        search_knowledge: tool({
          description:
            "Busca información oficial en la base de conocimiento de 77 Studio sobre servicios, playbooks y datos de contacto.",
          inputSchema: z.object({
            query: z.string().default(""),
            slug: z.string().optional(),
            audience: z.enum(["nuevos-clientes", "empresas", "fundadores-startups"]).optional(),
          }),
          execute: async (args) => {
            return await searchKnowledge(args);
          },
        }),
      },
    });

    turnMessages = [...turnMessages, ...result.response.messages];

    if (result.text && result.finishReason !== "tool-calls") {
      finalResponseText = result.text;
      break;
    }
  }

  await thread.post(finalResponseText || "Disculpa, no pude procesar esa consulta en este momento.");
});

export default channel;
