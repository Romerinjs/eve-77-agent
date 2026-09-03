/**
 * Módulo de Seguridad, Rate Limiting y Guardrails para 77 Studio AI Agent.
 */

// Estructura de almacenamiento en memoria para Rate Limiting
type RateLimitRecord = {
  timestamps: number[];
  lastMessageTime: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

// Configuración de límites
export const GUARD_CONFIG = {
  MAX_MESSAGE_LENGTH: 1000,
  MIN_COOLDOWN_MS: 1500, // 1.5 segundos entre mensajes para evitar spam rápido
  MAX_REQUESTS_PER_MINUTE: 10, // Máximo 10 consultas por minuto por usuario/IP
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // Limpieza de registros viejos cada 5 minutos
};

// Limpieza periódica de memoria para no acumular miles de registros viejos
setInterval(() => {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  for (const [id, record] of rateLimitMap.entries()) {
    record.timestamps = record.timestamps.filter((t) => t > oneMinuteAgo);
    if (record.timestamps.length === 0 && now - record.lastMessageTime > 60 * 1000) {
      rateLimitMap.delete(id);
    }
  }
}, GUARD_CONFIG.CLEANUP_INTERVAL_MS).unref();

export type GuardrailCheckResult =
  | { allowed: true; sanitizedText: string }
  | { allowed: false; reason: "RATE_LIMIT" | "COOLDOWN" | "TOO_LONG" | "PROMPT_INJECTION"; message: string };

// Patrones sospechosos de Jailbreak / Prompt Injection comunes
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /olvida\s+(todas\s+)?(las\s+)?instrucciones\s+(anteriores|previas)/i,
  /you\s+are\s+now\s+(DAN|unrestricted|in\s+developer\s+mode)/i,
  /act\s+as\s+an\s+unrestricted\s+AI/i,
  /ahora\s+eres\s+un\s+modelo\s+sin\s+restricciones/i,
  /system\s+prompt\s+override/i,
  /revela\s+tu\s+prompt\s+de\s+sistema/i,
  /show\s+me\s+your\s+system\s+instructions/i,
];

/**
 * Valida y aplica todas las capas de seguridad a un mensaje entrante.
 * 
 * @param clientId - Identificador del visitante (IP o threadId)
 * @param rawText - Texto original enviado por el usuario
 */
export function checkGuardrails(clientId: string, rawText: string): GuardrailCheckResult {
  const text = (rawText || "").trim();
  const now = Date.now();

  // 1. Validar mensaje no vacío
  if (!text) {
    return {
      allowed: false,
      reason: "TOO_LONG",
      message: "El mensaje no puede estar vacío.",
    };
  }

  // 2. Validar longitud máxima de caracteres
  if (text.length > GUARD_CONFIG.MAX_MESSAGE_LENGTH) {
    console.warn(`🛡️ [GUARDRAIL] Mensaje excede longitud máxima (${text.length}/${GUARD_CONFIG.MAX_MESSAGE_LENGTH})`);
    return {
      allowed: false,
      reason: "TOO_LONG",
      message: `El mensaje es demasiado largo. Por favor escribe una consulta de menos de ${GUARD_CONFIG.MAX_MESSAGE_LENGTH} caracteres.`,
    };
  }

  // 3. Validar Rate Limiting & Cooldown
  const record = rateLimitMap.get(clientId) || { timestamps: [], lastMessageTime: 0 };
  
  // A. Cooldown entre mensajes consecutivos
  if (now - record.lastMessageTime < GUARD_CONFIG.MIN_COOLDOWN_MS) {
    console.warn(`🛡️ [RATE LIMIT] Cooldown activo para el cliente ${clientId}`);
    return {
      allowed: false,
      reason: "COOLDOWN",
      message: "Por favor espera un segundo antes de enviar tu siguiente mensaje.",
    };
  }

  // B. Máximo de mensajes por minuto
  const oneMinuteAgo = now - 60 * 1000;
  record.timestamps = record.timestamps.filter((t) => t > oneMinuteAgo);

  if (record.timestamps.length >= GUARD_CONFIG.MAX_REQUESTS_PER_MINUTE) {
    console.warn(`🛡️ [RATE LIMIT] Límite por minuto alcanzado para el cliente ${clientId}`);
    return {
      allowed: false,
      reason: "RATE_LIMIT",
      message: "Has alcanzado el límite de mensajes por minuto. Por favor espera unos momentos para continuar.",
    };
  }

  // 4. Detección de Prompt Injection / Jailbreaks
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      console.warn(`🚨 [SECURITY INJECTION BLOCKED] Patrón malicioso detectado en cliente ${clientId}: "${text.substring(0, 50)}..."`);
      return {
        allowed: false,
        reason: "PROMPT_INJECTION",
        message: "Como asesor de 77 Studio, estoy enfocado exclusivamente en orientarte sobre desarrollo web, marketing y automatizaciones.",
      };
    }
  }

  // Registrar el timestamp de este mensaje aprobado
  record.timestamps.push(now);
  record.lastMessageTime = now;
  rateLimitMap.set(clientId, record);

  return {
    allowed: true,
    sanitizedText: text,
  };
}
