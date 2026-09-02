import readline from "node:readline";
import { generateText, tool } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { searchKnowledge } from "./lib/knowledge.js";

// Desactivar warnings redundantes
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

async function startInteractiveChat() {
  await loadEnv();

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.error("\n❌ Error: No se encontró GEMINI_API_KEY configurada en tu archivo .env\n");
    process.exit(1);
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const google = createGoogleGenerativeAI({ apiKey });
  const instructions = await readFile(path.resolve(process.cwd(), "agent", "instructions.md"), "utf8");

  console.log("\n========================================================");
  console.log("🤖 CHAT INTERACTIVO - 77 STUDIO AI AGENT (eve-77-agent)");
  console.log(`📡 Modelo: ${modelName} | Base de Conocimiento en RAM`);
  console.log("Escribe tu pregunta o 'salir' para terminar.");
  console.log("========================================================\n");

  let conversationHistory: any[] = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promptUser = () => {
    rl.question("\n👤 Tú: ", async (userInput) => {
      const trimmed = userInput.trim();
      if (!trimmed) {
        promptUser();
        return;
      }
      if (trimmed.toLowerCase() === "salir" || trimmed.toLowerCase() === "exit") {
        console.log("\n👋 ¡Hasta luego!\n");
        rl.close();
        process.exit(0);
      }

      conversationHistory.push({ role: "user", content: trimmed });

      process.stdout.write("🤖 77 Agent (Consultando base de conocimiento y pensando...)\r");

      try {
        let turnMessages = [...conversationHistory];
        let finalResponseText = "";

        // Ejecutar bucle multi-turno para resolver tool calls y generar la respuesta final
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

        // Limpiar la línea de estado "pensando..."
        process.stdout.write("                                                            \r");

        console.log("\n🤖 77 Agent:\n");
        console.log(finalResponseText || "Disculpa, no pude procesar esa consulta.");
        
        if (finalResponseText) {
          conversationHistory.push({ role: "assistant", content: finalResponseText });
        }
      } catch (err: any) {
        process.stdout.write("                                                            \r");
        console.error("\n❌ Error generando respuesta:", err?.message || err);
      }

      promptUser();
    });
  };

  promptUser();
}

startInteractiveChat();
