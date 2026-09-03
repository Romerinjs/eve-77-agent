# Referencia Técnica del Esquema Frontmatter (Zod)

El motor de conocimiento en `agent/lib/knowledge.ts` valida el frontmatter de cada archivo `.mdx` utilizando el siguiente esquema `Zod`:

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

## Sistema de Puntuación Léxica y Relevancia

Cuando un usuario hace una pregunta, el algoritmo de scoring de 77 Studio pondera cada campo con los siguientes pesos:

- **Keywords (8x):** Cada coincidencia en la lista de keywords añade 8 puntos.
- **Title (6x):** Coincidencia en el título añade 6 puntos.
- **Slug / Route / Module (5x):** Coincidencia en la URL o identificador añade 5 puntos.
- **Category (4x):** Coincidencia en la categoría añade 4 puntos.
- **Description (3x):** Coincidencia en la descripción añade 3 puntos.
- **Body Content (1x):** Coincidencia en el texto del cuerpo añade 1 punto.
- **Audience Boost (+5):** Si el usuario pertenece a una audiencia específica y el documento coincide con ella, recibe un boost de +5.
