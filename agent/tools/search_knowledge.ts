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
        "Términos o palabras clave que se deben buscar en la base de conocimiento oficial de 77 Studio (ej. 'Jordan Cruz', 'Tania Perez', 'roster equipo', 'Esteban Pantoja', 'meta ads', 'desarrollo web', 'automatizacion crm').",
      ),
    slug: z
      .string()
      .regex(/^[a-zA-Z0-9/_.-]+$/)
      .optional()
      .describe(
        "Slug o ID exacto del documento solo si lo conoces con certeza (ej. 'empresa/nosotros' para directivos y roster general, 'equipo/esteban', 'servicios/marketing', 'servicios/web', 'audiencias/nuevos-clientes', 'empresa/contacto'). Para búsquedas libres o por nombre, déjalo vacío y usa 'query'.",
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
    "Busca información oficial, verídica y vigente en la base de conocimiento de 77 Studio sobre servicios (Marketing, Web, IA & Automatización, Productos Digitales), equipo de trabajo y directivos (para el roster general y directivos como Jordan Cruz o Tania Pérez consultar 'empresa/nosotros'; para Esteban Pantoja consultar 'equipo/esteban'), playbooks de atención por audiencia y datos de contacto. Usa esta herramienta obligatoriamente antes de responder cualquier duda sobre la empresa, equipo o servicios. NUNCA inventes precios, miembros de equipo o condiciones que no existan en los documentos.",
  inputSchema,
  async execute(input) {
    return searchKnowledge(input);
  },
});
