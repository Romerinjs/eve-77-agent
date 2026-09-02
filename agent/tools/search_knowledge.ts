import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchKnowledge } from "../lib/knowledge.js";

const inputSchema = z
  .object({
    query: z
      .string()
      .trim()
      .default("")
      .describe(
        "Términos o palabras clave que se deben buscar en la base de conocimiento oficial de 77 Studio (ej. 'meta ads', 'desarrollo web', 'automatizacion crm', 'precios').",
      ),
    slug: z
      .string()
      .regex(/^[a-zA-Z0-9/_.-]+$/)
      .optional()
      .describe(
        "Slug o ID exacto del documento (ej. 'servicios/marketing', 'servicios/web', 'audiencias/nuevos-clientes', 'empresa/contacto').",
      ),
    audience: z
      .enum(["nuevos-clientes", "empresas", "fundadores-startups"])
      .optional()
      .describe(
        "Perfil del interlocutor para priorizar información relevante según su etapa o tipo de negocio.",
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(8)
      .default(4)
      .describe("Número máximo de documentos relevantes a retornar."),
  })
  .refine((input) => input.query.length > 0 || input.slug !== undefined, {
    message: "Debes proporcionar al menos 'query' o 'slug'.",
  });

export default defineTool({
  description:
    "Busca información oficial, verídica y vigente en la base de conocimiento de 77 Studio sobre servicios (Marketing, Web, IA & Automatización, Productos Digitales), playbooks de atención por audiencia y datos de contacto. Usa esta herramienta obligatoriamente antes de responder cualquier duda comercial o técnica. NUNCA inventes precios, condiciones o servicios que no existan en los documentos.",
  inputSchema,
  async execute(input) {
    return searchKnowledge(input);
  },
});
