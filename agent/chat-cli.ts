import readline from "node:readline";
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

  const conversationHistory: any[] = [];

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
        // Paso 1: Llamar al modelo con herramientas
        const step1 = await generateText({
          model: google(modelName),
          system: instructions,
          messages: conversationHistory,
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

        let finalResponseText = step1.text;

        // Si el modelo solicitó buscar información
        if (step1.toolCalls && step1.toolCalls.length > 0) {
          const toolCall: any = step1.toolCalls[0];
          const args = toolCall.args || { query: trimmed };
          const searchResult = await searchKnowledge(args);

          const toolMessages = [
            ...conversationHistory,
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId: toolCall.toolCallId,
                  toolName: toolCall.toolName,
                  args: toolCall.args,
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolCallId: toolCall.toolCallId,
                  toolName: toolCall.toolName,
                  output: {
                    type: "text",
                    value: JSON.stringify(searchResult),
                  },
                },
              ],
            },
          ];

          const step2 = await generateText({
            model: google(modelName),
            system: instructions,
            messages: toolMessages,
          });

          finalResponseText = step2.text;
        }

        console.log("\n🤖 77 Agent:\n");
        console.log(finalResponseText);
        conversationHistory.push({ role: "assistant", content: finalResponseText });
      } catch (err: any) {
        console.error("\n❌ Error generando respuesta:", err?.message || err);
      }

      promptUser();
    });
  };

  promptUser();
}

startInteractiveChat();
