import { readFileSync } from "node:fs";
import path from "node:path";
import { createMemoryState } from "@chat-adapter/state-memory";
import { createRedisState } from "@chat-adapter/state-redis";
import { createKapsoAdapter } from "@kapso/chat-adapter";
import { toAiMessages, type Message, type Thread } from "chat";
import { chatSdkChannel } from "eve/channels/chat-sdk";
import { generateText, tool } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { searchKnowledge, warmKnowledgeCache } from "../lib/knowledge.js";
import { checkGuardrails } from "../lib/guardrails.js";
import { whatsappDebouncer } from "../lib/debouncer.js";
import { getInstructionsForChannel } from "../lib/instructions.js";

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
    console.log("🔑 [KAPSO ENV] Variables de entorno cargadas correctamente.");
  } catch {
    console.log("ℹ️ [KAPSO ENV] Usando variables de entorno del sistema.");
  }
}
loadEnvSync();

// 2. Pre-cargar base de conocimiento en memoria RAM (0ms latencia)
warmKnowledgeCache()
  .then((docs) => {
    console.log(`📚 [KAPSO KNOWLEDGE] Base de conocimiento (${docs.length} MDX) indexada en RAM para WhatsApp.`);
  })
  .catch((err) => {
    console.error("❌ [KAPSO KNOWLEDGE] Error indexando conocimiento:", err);
  });

// 3. Resolver adaptador de estado (Upstash Redis en producción / RAM en local)
function getResolvedStateAdapter() {
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (redisUrl && (redisUrl.startsWith("redis://") || redisUrl.startsWith("rediss://"))) {
    try {
      console.log("💾 [KAPSO STATE] Persistencia distribuida activada con Upstash Redis.");
      const state = createRedisState({ url: redisUrl, keyPrefix: "eve-77-kapso" });
      state.connect().catch((err) => {
        console.error("❌ [KAPSO STATE] Error conectando a Redis:", err);
      });
      return state;
    } catch (err) {
      console.warn("⚠️ [KAPSO STATE] Error iniciando Redis adapter. Usando MemoryState como respaldo:", err);
    }
  }
  console.log("🧠 [KAPSO STATE] Usando MemoryState (RAM local para desarrollo).");
  return createMemoryState();
}

// 4. Instanciar el Adaptador Oficial de Kapso para Chat SDK
const kapsoApiKey = process.env.KAPSO_API_KEY;
const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID;
const webhookSecret = process.env.KAPSO_WEBHOOK_SECRET;

const kapsoAdapter = createKapsoAdapter({
  kapsoApiKey,
  phoneNumberId,
  webhookSecret,
  verifyWebhookSignatures: process.env.KAPSO_VERIFY_SIGNATURES === "true" || (process.env.NODE_ENV === "production" && !!webhookSecret),
  userName: "Sofía - 77 Studio",
  debug: process.env.NODE_ENV !== "production",
});

export const { bot, channel } = chatSdkChannel({
  userName: "Sofía - 77 Studio",
  adapters: {
    kapso: kapsoAdapter,
  },
  state: getResolvedStateAdapter(),
});



// Helper: Saludo dinámico según la hora en Colombia (GMT-5)
function getColombiaGreeting(): string {
  try {
    const fechaCol = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
    const h = fechaCol.getHours();
    const m = fechaCol.getMinutes();
    if (h >= 4 && h < 12) return "Buenos días";
    if (h >= 12 && (h < 18 || (h === 18 && m <= 30))) return "Buenas tardes";
    return "Buenas noches";
  } catch {
    return "Hola";
  }
}

// 5. Análisis Multimodal de Imágenes con Gemini Flash
async function analyzeImage(imageUrl: string, google: any, modelName: string): Promise<string> {
  try {
    console.log(`🖼️ [GEMINI VISION] Analizando imagen de WhatsApp: ${imageUrl}`);
    const res = await generateText({
      model: google(modelName),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe de manera muy breve (1 o 2 oraciones) lo que muestra esta imagen enviada por un cliente de 77 Studio (ej. comprobante, diseño web, error técnico, captura de pauta publicitaria).",
            },
            {
              type: "image",
              image: new URL(imageUrl),
            },
          ],
        },
      ],
    });
    return res.text.trim();
  } catch (err) {
    console.warn("⚠️ [GEMINI VISION] Error analizando imagen:", err);
    return "";
  }
}

// 6. Procesar consulta acumulada de WhatsApp tras el Debouncer
async function processDebouncedTurn(
  thread: Thread,
  userText: string,
  imageUrls: string[],
  senderName: string
) {
  console.log(`\n======================================================`);
  console.log(`📥 [KAPSO WHATSAPP INBOUND] Consulta consolidada: "${userText}"`);
  console.log(`🧵 Thread ID: ${thread.id} | Contacto: ${senderName || "Cliente"}`);
  console.log(`======================================================`);

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.error("❌ [KAPSO] Error: GEMINI_API_KEY no encontrada.");
    await thread.post("Hola 👋, en este momento estamos actualizando nuestro asistente. Por favor escríbenos directamente al +57 314 8490955.");
    return;
  }

  // 🛡️ Guardrails y Rate Limiting
  const guard = checkGuardrails(thread.id, userText);
  if (!guard.allowed) {
    console.warn(`🛡️ [GUARDRAIL] Bloqueo para hilo ${thread.id}: ${guard.reason}`);
    await thread.post(guard.message);
    return;
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const google = createGoogleGenerativeAI({ apiKey });
  const instructions = getInstructionsForChannel("kapso");

  // Si se recibieron imágenes, extraer su descripción
  let imageContext = "";
  if (imageUrls.length > 0) {
    const descriptions = await Promise.all(
      imageUrls.slice(0, 2).map((url) => analyzeImage(url, google, modelName))
    );
    const validDesc = descriptions.filter(Boolean);
    if (validDesc.length > 0) {
      imageContext = `\n[Contexto visual de imagen adjunta por el cliente: ${validDesc.join(" | ")}]`;
    }
  }

  const fullPrompt = `${guard.sanitizedText}${imageContext}`.trim();

  // 🔄 Recuperar historial previo del hilo
  let historyMessages: any[] = [];
  try {
    const fetchResult = await thread.adapter.fetchMessages(thread.id, { limit: 10 });
    if (fetchResult && fetchResult.messages && fetchResult.messages.length > 0) {
      historyMessages = await toAiMessages(fetchResult.messages);
    }
  } catch (e) {
    console.log("ℹ️ [KAPSO] Hilo nuevo o sin historial recuperable.");
  }

  const saludo = getColombiaGreeting();
  let turnMessages: any[] = [
    ...historyMessages,
    {
      role: "user",
      content: `[Saludo actual: ${saludo}][Contacto: ${senderName || "Visitante"}]\n${fullPrompt}`,
    },
  ];

  let finalResponseText = "";

  try {
    console.log(`🤖 [GEMINI] Consultando modelo (${modelName}) con búsqueda de conocimiento en RAM...`);

    for (let turn = 1; turn <= 4; turn++) {
      const result = await generateText({
        model: google(modelName),
        system: instructions,
        messages: turnMessages,
        tools: {
          search_knowledge: tool({
            description:
              "Busca información oficial y verídica en la base de conocimiento de 77 Studio sobre servicios (Marketing, Web Astro, IA & Automatizaciones, SaaS), equipo (ej. Esteban Pantoja), playbooks comerciales y datos de contacto.",
            inputSchema: z.object({
              query: z
                .string()
                .default("")
                .describe("Términos clave a buscar (ej. 'marketing', 'desarrollo web', 'automatizaciones', 'Esteban Pantoja')."),
              slug: z
                .string()
                .optional()
                .describe("Slug exacto si se conoce con certeza (ej. 'servicios/marketing', 'empresa/posicionamiento')."),
              audience: z
                .enum(["nuevos-clientes", "empresas", "fundadores-startups"])
                .optional()
                .describe("Perfil del cliente para priorizar respuestas relevantes."),
            }),
            execute: async (args) => {
              console.log(`🔍 [TOOL search_knowledge] Ejecutando:`, args);
              const searchRes = await searchKnowledge(args);
              console.log(`   📄 Encontrados: ${searchRes.documents.length} docs (Top: ${searchRes.documents[0]?.slug || "ninguno"})`);
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

    // 🛡️ Fallback forzado si el LLM no generó texto final tras tool calls
    if (!finalResponseText || !finalResponseText.trim()) {
      const forcedResult = await generateText({
        model: google(modelName),
        system: instructions,
        prompt: `El cliente preguntó por WhatsApp: "${fullPrompt}". Responde como Sofía, Asesora Comercial de 77 Studio, en un mensaje súper conciso de 2 a 3 líneas estilo WhatsApp. NUNCA pidas presupuesto. Explica brevemente el valor del servicio e invita a agendar llamada de diagnóstico o escribir por WhatsApp (+57 314 8490955).`,
      });
      finalResponseText = forcedResult.text;
    }

    console.log(`\n📤 [KAPSO OUTBOUND] Enviando respuesta a WhatsApp (${finalResponseText.length} caracteres):`);
    console.log(finalResponseText);
    console.log(`======================================================\n`);

    // Enviar respuesta al hilo de WhatsApp vía Kapso
    await thread.post(
      finalResponseText ||
        "¡Hola! 👋 Soy Sofía de 77 Studio. Con gusto te asesoro en desarrollo web, marketing y automatizaciones con IA para tu empresa. ¿En qué área te gustaría que nos enfoquemos?"
    );
  } catch (error) {
    console.error("❌ [KAPSO] Error procesando mensaje de WhatsApp:", error);
    await thread.post(
      "Disculpa la demora, tuvimos un inconveniente de conexión. Por favor escríbenos directamente a nuestro WhatsApp oficial: +57 314 8490955."
    );
  }
}

// 7. Manejador de eventos entrantes de Chat SDK
async function handleKapsoInbound(thread: Thread, message: Message) {
  const userText = message.text || (message as any).rawText || (message as any).content || "";
  
  // Extraer imágenes adjuntas si existen
  const imageUrls: string[] = [];
  if (message.attachments && message.attachments.length > 0) {
    for (const att of message.attachments) {
      const mime = (att as any).mimeType || (att as any).contentType || (att as any).type || "";
      if (typeof mime === "string" && (mime.startsWith("image/") || mime.includes("image")) && (att as any).url) {
        imageUrls.push((att as any).url);
      }
    }
  }

  // Si no hay texto ni imagen, descartar
  if (!userText.trim() && imageUrls.length === 0) {
    return;
  }

  const senderName = (message.author as any)?.displayName || (message.author as any)?.name || (message.author as any)?.userName || "";

  // En Vercel Serverless, procesar de inmediato (Kapso ya aplica su buffer nativo de 5s en la nube)
  await processDebouncedTurn(thread, userText, imageUrls, senderName);
}

// Registrar manejadores de eventos
bot.onDirectMessage(handleKapsoInbound);
bot.onNewMessage(handleKapsoInbound);

console.log("🟢 [EVE CHANNEL] Canal Kapso (WhatsApp) montado y listo para recibir tráfico en /eve/v1/kapso\n");

export default channel;
