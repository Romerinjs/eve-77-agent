import { getKnowledgeCache } from "../agent/lib/knowledge.js";
import { writeFileSync } from "node:fs";
import path from "node:path";

async function generate() {
  const docs = await getKnowledgeCache();
  console.log(`📦 Empaquetando ${docs.length} documentos MDX en módulo TypeScript estático...`);
  
  const targetPath = path.resolve(process.cwd(), "agent", "lib", "knowledge-data.ts");
  const tsContent = `// AUTO-GENERATED STATIC KNOWLEDGE BUNDLE
// Garantiza 0ms de I/O y disponibilidad absoluta en Vercel Serverless
import type { KnowledgeDocument } from "./knowledge.js";

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

export const STATIC_KNOWLEDGE_DOCUMENTS: CachedDocument[] = ${JSON.stringify(docs, null, 2)};
`;

  writeFileSync(targetPath, tsContent, "utf8");
  console.log(`✅ ¡Módulo estático generado con éxito en ${targetPath}!`);
}

generate().catch(console.error);
