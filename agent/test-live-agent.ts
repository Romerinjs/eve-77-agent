import { generateText, tool } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { searchKnowledge } from "./lib/knowledge.js";

async function loadEnv() {
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
    // Si no hay .env, continuar
  }
}

async function runLiveTest() {
  await loadEnv();

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.error("❌ No se encontró GEMINI_API_KEY en .env");
    return;
  }

  const google = createGoogleGenerativeAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const instructions = await readFile(path.resolve(process.cwd(), "agent", "instructions.md"), "utf8");

  console.log(`🚀 [LIVE TEST] Conectando con Google Gemini (${modelName}) y base de conocimiento...`);
  const userQuery = "¿Qué servicios de Meta Ads y Marketing ofrecen y cómo me pueden ayudar?";
  console.log(`💬 Pregunta del usuario: '${userQuery}'\n`);

  const messages: any[] = [
    { role: "user", content: userQuery }
  ];

  // Turno 1: Gemini analiza la pregunta y decide invocar search_knowledge
  const step1 = await generateText({
    model: google(modelName),
    system: instructions,
    messages,
    tools: {
      search_knowledge: tool({
        description:
          "Busca información oficial en la base de conocimiento de 77 Studio sobre servicios, playbooks y datos de contacto.",
        inputSchema: z.object({
          query: z.string().default(""),
          slug: z.string().optional(),
          audience: z.enum(["nuevos-clientes", "empresas", "fundadores-startups"]).optional(),
        }),
      }),
    },
  });

  if (step1.toolCalls && step1.toolCalls.length > 0) {
    for (const toolCall of step1.toolCalls) {
      const tc: any = toolCall;
      console.log(`🛠️ [TOOL INVOKED] ${tc.toolName} con argumentos:`, tc.args);
      const args = tc.args || { query: userQuery };
      const searchResult = await searchKnowledge(args);
      console.log(`   📚 Documentos encontrados: ${searchResult.documents.length}`);
      for (const d of searchResult.documents) {
        console.log(`   - [${d.slug}] ${d.title} (Score: ${d.score})`);
      }

      // Añadir la llamada y el resultado al historial de la conversación
      messages.push({
        role: "assistant",
        content: [
          {
            type: "tool-call",
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            args: tc.args,
          },
        ],
      });

      messages.push({
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            output: {
              type: "text",
              value: JSON.stringify(searchResult),
            },
          },
        ],
      });
    }

    // Turno 2: Gemini genera la respuesta final basada en el conocimiento obtenido
    const step2 = await generateText({
      model: google(modelName),
      system: instructions,
      messages,
    });

    console.log("\n=================== RESPUESTA GENERADA POR EL AGENTE ===================");
    console.log(step2.text);
    console.log("========================================================================\n");
  } else {
    console.log("\n=================== RESPUESTA GENERADA POR EL AGENTE ===================");
    console.log(step1.text);
    console.log("========================================================================\n");
  }
}

runLiveTest().catch((err) => {
  console.error("❌ Error en prueba en vivo:", err);
});
