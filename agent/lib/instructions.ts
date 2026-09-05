import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type SupportedChannel = "kapso" | "web" | "cli" | (string & {});

interface InstructionsCache {
  base: string | null;
  channels: Record<string, string>;
  composed: Record<string, string>;
}

const cache: InstructionsCache = {
  base: null,
  channels: {},
  composed: {},
};

function getProjectRoots(): string[] {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return [
    process.cwd(),
    path.resolve(currentDir, ".."),
    path.resolve(currentDir, "../.."),
  ];
}

function resolveFilePath(relativePath: string): string | null {
  const roots = getProjectRoots();
  for (const root of roots) {
    const fullPath = path.resolve(root, relativePath);
    try {
      // Intentar leer para validar existencia
      readFileSync(fullPath, "utf8");
      return fullPath;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Carga las instrucciones base comunes a todos los canales.
 */
export function getBaseInstructions(): string {
  if (cache.base) {
    return cache.base;
  }

  const basePath = resolveFilePath("agent/instructions/base.md");
  if (basePath) {
    try {
      cache.base = readFileSync(basePath, "utf8");
      return cache.base;
    } catch (e) {
      console.warn("⚠️ [INSTRUCTIONS] Error leyendo base.md:", e);
    }
  }

  // Fallback a agent/instructions.md legado
  const legacyPath = resolveFilePath("agent/instructions.md");
  if (legacyPath) {
    try {
      cache.base = readFileSync(legacyPath, "utf8");
      return cache.base;
    } catch (e) {
      console.warn("⚠️ [INSTRUCTIONS] Error leyendo instructions.md legado:", e);
    }
  }

  cache.base =
    "Eres Sofía, asesora comercial de 77 Studio. Responde de forma clara, concisa y comercial guiando a una llamada de diagnóstico o WhatsApp.";
  return cache.base;
}

/**
 * Carga la sub-instrucción específica de un canal (ej. 'kapso', 'web').
 */
export function getSubInstruction(channel: SupportedChannel): string {
  if (cache.channels[channel]) {
    return cache.channels[channel];
  }

  const channelPath = resolveFilePath(`agent/instructions/${channel}.md`);
  if (channelPath) {
    try {
      const content = readFileSync(channelPath, "utf8");
      cache.channels[channel] = content;
      return content;
    } catch (e) {
      console.warn(`⚠️ [INSTRUCTIONS] Error leyendo sub-instrucción para canal '${channel}':`, e);
    }
  }

  return "";
}

/**
 * Obtiene las instrucciones compuestas completas (Base + Sub-Instrucción de Canal).
 * Si no existe sub-instrucción específica, retorna las instrucciones base.
 */
export function getInstructionsForChannel(channel: SupportedChannel = "web"): string {
  if (cache.composed[channel]) {
    return cache.composed[channel];
  }

  const base = getBaseInstructions();
  const sub = getSubInstruction(channel);

  if (!sub.trim()) {
    cache.composed[channel] = base;
    return base;
  }

  const composed = `${base}\n\n---\n\n# DIRECTRICES ESPECÍFICAS DE CANAL (${channel.toUpperCase()})\n\n${sub}`.trim();
  cache.composed[channel] = composed;
  return composed;
}

/**
 * Invalida el caché en memoria de instrucciones (útil para pruebas y recargas dinámicas).
 */
export function invalidateInstructionsCache(): void {
  cache.base = null;
  cache.channels = {};
  cache.composed = {};
}
