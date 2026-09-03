import { readFileSync } from "node:fs";
import path from "node:path";
import { createMemoryState } from "@chat-adapter/state-memory";
import { createWebAdapter } from "@chat-adapter/web";
import type { Message, Thread } from "chat";
import { chatSdkChannel } from "eve/channels/chat-sdk";
import { generateText, tool } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { searchKnowledge, warmKnowledgeCache } from "../lib/knowledge.js";

// Desactivar warnings internos del SDK
process.env.AI_SDK_LOG_WARNINGS = "false";

// 1. Cargar variables de entorno sincrónicamente desde .env
function loadEnvSync() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    const envContent = readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (key && rest.length > 0) {
        process.env[key.trim()] = rest.join("=").trim();
      }
    }
    console.log("🔑 [EVE ENV] Variables de entorno cargadas correctamente.");
  } catch (e) {
    console.log("ℹ️ [EVE ENV] Usando variables de entorno del sistema.");
  }
}
loadEnvSync();

// 2. Pre-cargar base de conocimiento en RAM
warmKnowledgeCache()
  .then(() => {
    console.log("📚 [EVE KNOWLEDGE] Base de conocimiento (14 MDX) indexada en RAM.");
  })
  .catch((err) => {
    console.error("❌ [EVE KNOWLEDGE] Error indexando conocimiento:", err);
  });

// 3. Crear el adaptador Web oficial de Chat SDK
export const { bot, channel } = chatSdkChannel({
  userName: "77 Studio Assistant",
  adapters: {
    web: createWebAdapter({
      userName: "77 Studio Assistant",
      getUser: async (_req: Request) => {
        return {
          id: "web-visitor",
          name: "Visitante Web",
        };
      },
    }),
  },
  state: createMemoryState(),
});

// Cache de instrucciones
let cachedInstructions: string | null = null;
function getInstructionsSync(): string {
  if (!cachedInstructions) {
    try {
      cachedInstructions = readFileSync(path.resolve(process.cwd(), "agent", "instructions.md"), "utf8");
    } catch {
      cachedInstructions = "Eres el consultor y asesor oficial de 77 Studio.";
    }
  }
  return cachedInstructions;
}

// 4. Manejador unificado de consultas entrantes desde el Chat Web
async function handleWebMessage(thread: Thread, message: Message) {
  const userText = message.text || (message as any).rawText || (message as any).content || "";
  
  if (!userText || !userText.trim()) {
    console.log("⚠️ [WEB CHAT] Mensaje vacío recibido.");
    return;
  }

  console.log(`\n======================================================`);
  console.log(`📥 [WEB CHAT INBOUND] Nueva consulta: "${userText}"`);
  console.log(`🧵 Thread ID: ${thread.id}`);
  console.log(`======================================================`);

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.error("❌ [WEB CHAT] Error: No se encontró GEMINI_API_KEY en el servidor.");
    await thread.post("Lo siento, no tengo configurada la clave del modelo de IA en este momento.");
    return;
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const google = createGoogleGenerativeAI({ apiKey });
  const instructions = getInstructionsSync();

  let turnMessages: any[] = [{ role: "user", content: userText }];
  let finalResponseText = "";

  try {
    console.log(`🤖 [GEMINI] Consultando modelo (${modelName}) con búsqueda de conocimiento...`);

    for (let turn = 1; turn <= 4; turn++) {
      const result = await generateText({
        model: google(modelName),
        system: instructions,
        messages: turnMessages,
        tools: {
          search_knowledge: tool({
            description:
              "Busca información oficial en la base de conocimiento de 77 Studio sobre servicios, playbooks, equipo y datos de contacto.",
            inputSchema: z.object({
              query: z.string().default(""),
              slug: z.string().optional(),
              audience: z.enum(["nuevos-clientes", "empresas", "fundadores-startups"]).optional(),
            }),
            execute: async (args) => {
              console.log(`🔍 [TOOL search_knowledge] Ejecutando búsqueda con:`, args);
              const searchRes = await searchKnowledge(args);
              console.log(`   📄 Encontrados: ${searchRes.documents.length} documentos (Top: ${searchRes.documents[0]?.slug || 'ninguno'})`);
              return searchRes;
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

    console.log(`\n📤 [WEB CHAT OUTBOUND] Enviando respuesta (${finalResponseText.length} caracteres):`);
    console.log(finalResponseText);
    console.log(`======================================================\n`);

    // Responder al hilo web
    await thread.post(finalResponseText || "En 77 Studio estamos listos para asesorarte. ¿En qué área de desarrollo web, marketing o automatización podemos ayudarte?");
  } catch (error: any) {
    console.error("❌ [WEB CHAT] Error procesando consulta:", error);
    await thread.post("Disculpa, ocurrió un error interno procesando tu consulta. Por favor intenta de nuevo o escríbenos por WhatsApp.");
  }
}

// Registrar eventos de Chat SDK
bot.onDirectMessage(handleWebMessage);
bot.onNewMention(handleWebMessage);
bot.onSubscribedMessage(handleWebMessage);
bot.onNewMessage(handleWebMessage);

console.log("🌐 [EVE CHANNEL] Canal Web montado y listo para recibir tráfico en /eve/v1/web\n");

export default channel;
