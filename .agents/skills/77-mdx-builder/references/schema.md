# Referencia Técnica del Esquema Zod y Motor de Búsqueda

## Esquema Zod (`FrontmatterSchema`)

El motor de conocimiento en `agent/lib/knowledge.ts` valida el frontmatter de cada archivo `.mdx` utilizando:

```typescript
export const FrontmatterSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    module: z.string().optional(),
    route: z.string().optional(),
    whatsappMessage: z.string().optional(),
    slug: z.string().optional(),
    category: z.string().optional(),
    audience: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    related_slugs: z.array(z.string()).default([]),
  })
  .passthrough();
```

---

## Ponderación de Scoring Léxico

El motor de búsqueda pondera las coincidencias en memoria RAM con los siguientes multiplicadores:

| Campo | Multiplicador | Justificación |
| :--- | :--- | :--- |
| `keywords` | **8x** | Intención de búsqueda explícita. |
| `title` | **6x** | Identidad del tema principal. |
| `slug / route / module` | **5x** | Identificador de recurso único. |
| `category` | **4x** | Agrupación semántica. |
| `description` | **3x** | Resumen ejecutivo del módulo. |
| `body (AST text)` | **1x** | Coincidencia en el texto general. |
| `audience` | **+5 boost** | Coincidencia con el segmento del usuario. |
