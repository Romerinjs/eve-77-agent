import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function bundleInstructions() {
  console.log("📦 Empaquetando instrucciones Markdown en módulo TypeScript estático...");

  const baseContent = readFileSync(path.resolve(process.cwd(), "agent/instructions/base.md"), "utf8");
  const webContent = readFileSync(path.resolve(process.cwd(), "agent/instructions/web.md"), "utf8");
  const kapsoContent = readFileSync(path.resolve(process.cwd(), "agent/instructions/kapso.md"), "utf8");

  const targetPath = path.resolve(process.cwd(), "agent/lib/instructions-data.ts");

  const tsContent = `// AUTO-GENERATED STATIC INSTRUCTIONS BUNDLE
// Garantiza 0ms de I/O y disponibilidad absoluta en Vercel Serverless
// Generado automáticamente por scripts/bundle-instructions.ts

export const STATIC_BASE_INSTRUCTIONS = ${JSON.stringify(baseContent)};

export const STATIC_CHANNEL_INSTRUCTIONS: Record<string, string> = {
  web: ${JSON.stringify(webContent)},
  kapso: ${JSON.stringify(kapsoContent)},
};
`;

  writeFileSync(targetPath, tsContent, "utf8");
  console.log(`✅ ¡Instrucciones estáticas empaquetadas exitosamente en ${targetPath}!`);
}

bundleInstructions();
