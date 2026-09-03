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
    // Continuar
  }
}

async function testPrompt(query: string, label: string, existingMessages: any[] = []) {
  const apiKey = process.env.GEMINI_API_KEY!;
  const google = createGoogleGenerativeAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const instructions = await readFile(path.resolve(process.cwd(), "agent", "instructions.md"), "utf8");

  console.log(`\n🧪 [TEST: ${label}] Pregunta: "${query}"`);

  let messages: any[] = [...existingMessages, { role: "user", content: query }];
  let finalResponseText = "";

  for (let turn = 1; turn <= 4; turn++) {
    const result = await generateText({
      model: google(modelName),
      system: instructions,
      messages,
      tools: {
        search_knowledge: tool({
          description:
            "Busca información oficial, verídica y vigente en la base de conocimiento de 77 Studio sobre servicios, equipo (ej. Esteban Pantoja), playbooks y datos de contacto.",
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

    messages = [...messages, ...result.response.messages];

    if (result.text && result.finishReason !== "tool-calls") {
      finalResponseText = result.text;
      break;
    }
  }

  // Síntesis forzada si quedó en tool-calls sin texto
  if (!finalResponseText || !finalResponseText.trim()) {
    const forced = await generateText({
      model: google(modelName),
      system: instructions,
      messages,
    });
    finalResponseText = forced.text;
  }

  console.log("🤖 Respuesta:");
  console.log(finalResponseText);

  return messages;
}

async function runTests() {
  await loadEnv();

  // Caso 1: Perfil de Equipo Registrado (Esteban Pantoja)
  const estebanHistory = await testPrompt("pero no sabes nada de esteban pantoja?", "Equipo - Esteban Pantoja");

  // Caso 2: Multiturno sobre Esteban Pantoja (continuidad contextual)
  await testPrompt("¿y qué proyectos destacados ha desarrollado en 77 Studio?", "Multiturno - Contexto Previo", estebanHistory);

  // Caso 3: Persona no registrada (comprobar que no use meta-lenguaje)
  await testPrompt("¿Quién es Carlos Pérez en 77 Studio y qué hace?", "Persona Desconocida");

  // Caso 4: Petición fuera de alcance
  await testPrompt("Escríbeme un poema sobre los planetas del sistema solar", "Fuera de Alcance");

  // Caso 5: Consulta comercial directa y concisa
  await testPrompt("¿Qué tecnología usan para desarrollo web y cuánto tardan?", "Desarrollo Web");
}

runTests().catch(console.error);
