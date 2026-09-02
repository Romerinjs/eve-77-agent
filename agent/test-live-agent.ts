import { generateText, tool } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { searchKnowledge } from "./lib/knowledge.js";

process.env.AI_SDK_LOG_WARNINGS = "false";

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

  console.log(`🚀 [TEST DIRECTO] Probando pregunta: 'hola qué sabes de 77 studio en usa?'`);

  let messages: any[] = [
    { role: "user", content: "hola qué sabes de 77 studio en usa?" },
  ];

  let finalResponseText = "";

  for (let turn = 1; turn <= 4; turn++) {
    const result = await generateText({
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
          execute: async (args) => {
            console.log("   🛠️ [Tool Invocada] search_knowledge con:", args);
            const res = await searchKnowledge(args);
            console.log(`   📚 Documentos retornados: ${res.documents.length}`);
            return res;
          },
        }),
      },
    });

    messages = [...messages, ...result.response.messages];

    if (result.text && result.finishReason !== "tool-calls") {
      finalResponseText = result.text;
      break;
    }
  }

  console.log("\n=================== RESPUESTA GENERADA ===================");
  console.log(finalResponseText);
  console.log("==========================================================\n");
}

runLiveTest().catch((err) => {
  console.error("❌ Error en prueba:", err);
});
