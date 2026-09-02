import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import { toString } from "mdast-util-to-string";
import { z } from "zod";

const MAX_CONTENT_CHARS = 12_000;

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

export type KnowledgeDocument = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  module?: string;
  route?: string;
  whatsappMessage?: string;
  category?: string;
  audience?: string;
  keywords: string[];
  related_slugs: string[];
  content: string;
  contentTruncated: boolean;
};

type CachedDocument = KnowledgeDocument & {
  search: {
    id: string;
    slug: string;
    route: string;
    module: string;
    title: string;
    description: string;
    category: string;
    audience: string;
    keywords: string[];
    content: string;
  };
};

let cachePromise: Promise<CachedDocument[]> | undefined;

export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

async function pathExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isDirectory() || s.isFile();
  } catch {
    return false;
  }
}

async function walk(directory: string): Promise<string[]> {
  if (!(await pathExists(directory))) {
    return [];
  }
  const ignoredFiles = new Set(["audit.md", "changelog.md", "governance.md", "roadmap.md"]);
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return walk(absolutePath);
      }
      if (
        entry.isFile() &&
        (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) &&
        !ignoredFiles.has(entry.name.toLowerCase())
      ) {
        return [absolutePath];
      }
      return [];
    }),
  );
  return nestedFiles.flat().sort();
}

function deriveDefaultSlug(filePath: string, rootDir: string): string {
  const rel = path.relative(rootDir, filePath).replaceAll(path.sep, "/");
  return rel.replace(/\/index\.(mdx|md)$/, "").replace(/\.(mdx|md)$/, "");
}

function parseMdx(source: string, defaultId: string): KnowledgeDocument {
  const parsed = matter(source);
  const metadata = FrontmatterSchema.parse(parsed.data);

  let rawBody = parsed.content;

  // Limpiar exportaciones de código TS/Astro si existen
  rawBody = rawBody.replace(/export\s+const\s+\w+\s*=\s*\{[\s\S]*?\};/g, "");

  let text = "";
  try {
    const tree = unified().use(remarkParse).use(remarkMdx).parse(rawBody);
    text = toString(tree).replace(/\s+/g, " ").trim();
  } catch {
    // Fallback simple si el parser AST encuentra sintaxis no estándar
    text = rawBody.replace(/[#*`_[\]()]/g, " ").replace(/\s+/g, " ").trim();
  }

  const slug = metadata.slug || metadata.route?.replace(/^\//, "") || defaultId;
  const id = metadata.module || slug || defaultId;

  return {
    id,
    slug,
    title: metadata.title ?? id,
    description: metadata.description,
    module: metadata.module,
    route: metadata.route,
    whatsappMessage: metadata.whatsappMessage,
    category: metadata.category,
    audience: metadata.audience,
    keywords: metadata.keywords.map((k) => k.trim()).filter(Boolean),
    related_slugs: metadata.related_slugs.map((r) => r.trim()).filter(Boolean),
    content: text.slice(0, MAX_CONTENT_CHARS),
    contentTruncated: text.length > MAX_CONTENT_CHARS,
  };
}

async function readDocument(filePath: string, rootDir: string): Promise<CachedDocument> {
  const source = await readFile(filePath, "utf8");
  const defaultId = deriveDefaultSlug(filePath, rootDir);
  const document = parseMdx(source, defaultId);

  return {
    ...document,
    search: {
      id: normalize(document.id),
      slug: normalize(document.slug),
      route: normalize(document.route ?? ""),
      module: normalize(document.module ?? ""),
      title: normalize(document.title),
      description: normalize(document.description ?? ""),
      category: normalize(document.category ?? ""),
      audience: normalize(document.audience ?? ""),
      keywords: document.keywords.map(normalize),
      content: normalize(document.content),
    },
  };
}

async function loadKnowledgeCache(): Promise<CachedDocument[]> {
  const roots = [
    { path: path.resolve(process.cwd(), "77"), name: "77" },
    { path: path.resolve(process.cwd(), "content", "knowledge"), name: "knowledge" },
  ];

  const allDocuments: CachedDocument[] = [];
  const seenIds = new Set<string>();

  for (const root of roots) {
    const files = await walk(root.path);
    const docs = await Promise.all(files.map((file) => readDocument(file, root.path)));
    for (const doc of docs) {
      if (!seenIds.has(doc.slug)) {
        seenIds.add(doc.slug);
        allDocuments.push(doc);
      }
    }
  }

  return allDocuments;
}

/**
 * Obtiene el caché en memoria de documentos MDX.
 * Singleton con Promesa concurrente para evitar I/O redundante.
 */
export async function getKnowledgeCache(): Promise<CachedDocument[]> {
  if (!cachePromise) {
    cachePromise = loadKnowledgeCache().catch((error) => {
      cachePromise = undefined;
      throw error;
    });
  }
  return cachePromise;
}

function scoreDocument(
  doc: CachedDocument,
  terms: string[],
  targetAudience?: string,
): number {
  let score = 0;

  // Boost de Audiencia
  if (targetAudience) {
    const normTarget = normalize(targetAudience);
    if (doc.search.audience.includes(normTarget)) {
      score += 5;
    } else if (doc.search.audience === "todas" || !doc.search.audience) {
      score += 1;
    }
  }

  if (terms.length === 0) {
    return score > 0 ? score : 1;
  }

  for (const term of terms) {
    let termScore = 0;

    // Keywords = Peso Máximo (8x)
    if (doc.search.keywords.some((k) => k.includes(term))) {
      termScore += 8;
    }
    // Título = Peso Alto (6x)
    if (doc.search.title.includes(term)) {
      termScore += 6;
    }
    // Slug / Route / Module (5x)
    if (
      doc.search.slug.includes(term) ||
      doc.search.route.includes(term) ||
      doc.search.module.includes(term)
    ) {
      termScore += 5;
    }
    // Categoría (4x)
    if (doc.search.category.includes(term)) {
      termScore += 4;
    }
    // Descripción (3x)
    if (doc.search.description.includes(term)) {
      termScore += 3;
    }
    // Contenido general (1x)
    if (doc.search.content.includes(term)) {
      termScore += 1;
    }

    score += termScore;
  }

  return score;
}

export type SearchKnowledgeInput = {
  query?: string;
  slug?: string;
  audience?: string;
  limit?: number;
};

export async function searchKnowledge(input: SearchKnowledgeInput = {}) {
  const documents = await getKnowledgeCache();
  const limit = Math.max(1, Math.min(input?.limit ?? 5, 10));

  const query = normalize(input?.query ?? "");
  const terms = query.split(/\s+/).filter(Boolean);
  const targetSlug = input?.slug ? normalize(input.slug) : undefined;
  const targetAudience = input?.audience ? normalize(input.audience) : undefined;

  const matches = documents
    .filter((doc) => {
      if (!targetSlug) return true;
      return (
        doc.search.id === targetSlug ||
        doc.search.slug === targetSlug ||
        doc.search.route === targetSlug ||
        doc.search.route === `/${targetSlug}` ||
        doc.search.module === targetSlug
      );
    })
    .map((document) => ({
      document,
      score: scoreDocument(document, terms, targetAudience),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.document.slug.localeCompare(b.document.slug));

  return {
    documents: matches.slice(0, limit).map(({ document, score }) => {
      const { search: _search, ...publicDocument } = document;
      return {
        ...publicDocument,
        score,
      };
    }),
    total: matches.length,
    truncated: matches.length > limit,
  };
}

/**
 * Invalida el caché en memoria para hot-reload o recargas en desarrollo.
 */
export function invalidateKnowledgeCache(): void {
  cachePromise = undefined;
}

/**
 * Pre-carga el caché en memoria RAM en el arranque del servidor.
 */
export async function warmKnowledgeCache(): Promise<void> {
  await getKnowledgeCache();
}
