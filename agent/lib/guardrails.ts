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
  | {
      allowed: false;
      reason:
        | "RATE_LIMIT"
        | "COOLDOWN"
        | "TOO_LONG"
        | "PROMPT_INJECTION"
        | "INAPPROPRIATE_CONTENT"
        | "ILLEGAL_CONTENT"
        | "OFF_TOPIC";
      message: string;
    };

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

// Patrones de lenguaje obsceno, vulgar o acoso sexual explícito
const INAPPROPRIATE_PATTERNS = [
  /\b(picha|verga|pinga|polla|chimbo|mond[aá]|culo|tetas|senos|vagina|pene|sexo|porn[oó]|gemidos?|mamada|mamadas|chuparla|chupame(la)?)\b/i,
  /\b(dar\s+(la\s+)?picha|hacer\s+el\s+amor|vamos\s+a\s+coger|quieres\s+coger|te\s+quiero\s+coger|desnud[ao]s?)\b/i,
  /\b(prostitut[ao]s?|escort|pack\s+de\s+fotos|nudes)\b/i,
];

// Patrones de terrorismo, violencia extrema o actividades ilícitas
const ILLEGAL_PATTERNS = [
  /\b(al[- ]?qaeda|alcaeda|isis|daesh|talib[aá]n|yihad|jihad|terroris(mo|ta)s?)\b/i,
  /\b(fabricar\s+bombas?|hacer\s+explosivos?|armas?\s+(de\s+fuego\s+)?ilegales?)\b/i,
  /\b(sicariato|contratar\s+sicario|vender\s+droga|narcotr[aá]fico)\b/i,
];

// Patrones de trivia de cultura general, historia ajena y soporte de dispositivos externos
const OFF_TOPIC_PATTERNS = [
  // Preguntas sobre fundación de marcas o entidades ajenas (excluyendo 77 Studio)
  /\b(cu[aá]ndo|en\s+qu[eé]\s+a[nñ]o|qui[eé]n)\s+(se\s+)?fund[oó]\s+(?!77\s+studio)/i,
  /\b(qui[eé]n\s+es\s+el\s+fundador\s+de)\s+(?!77\s+studio)/i,
  // Independencia, historia externa, tareas escolares
  /\b(cu[aá]ndo|en\s+qu[eé]\s+a[nñ]o)\s+(se\s+declar[oó]\s+la\s+independencia|se\s+independiz[oó]|fue\s+la\s+independencia)/i,
  /\b(independencia\s+de\s+(estados\s+unidos|esetados\s+unidos|colombia|m[eé]xico|espa[nñ]a|per[uú]|argentina|chile))\b/i,
  // Soporte técnico de dispositivos ajenos (iPhone, Android, Windows, Mac)
  /\b(c[oó]mo\s+(entro|entrar|accedo|acceder|ir)\s+a\s+(los\s+)?(ajustes|configuraci[oó]n)\s+(en|de)\s+(mi\s+)?(iphone|android|ios|samsung|xiaomi|celular|tel[eé]fono|pc|windows|mac))\b/i,
  /\b(c[oó]mo\s+formatear\s+(mi\s+)?(celular|iphone|pc|computador|laptop|disco))\b/i,
  /\b(c[oó]mo\s+reiniciar\s+de\s+f[aá]brica\s+(mi\s+)?(celular|iphone))\b/i,
  // Tutoriales de instalación externa genérica (WordPress local con XAMPP)
  /\b(c[oó]mo\s+(instalar|configurar)\s+(wordpress\s+en\s+local|xampp|laragon|wamp|mysql\s+en\s+mi\s+pc))\b/i,
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

  // 5. Detección de Lenguaje Obsceno / Acoso Sexual
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    if (pattern.test(text)) {
      console.warn(`🚨 [INAPPROPRIATE BLOCKED] Mensaje inapropiado detectado en cliente ${clientId}: "${text.substring(0, 50)}..."`);
      return {
        allowed: false,
        reason: "INAPPROPRIATE_CONTENT",
        message: "Este es un canal corporativo de 77 Studio exclusivo para consultas comerciales y profesionales. No se toleran mensajes inapropiados.",
      };
    }
  }

  // 6. Detección de Terrorismo / Actividades Ilícitas
  for (const pattern of ILLEGAL_PATTERNS) {
    if (pattern.test(text)) {
      console.warn(`🚨 [ILLEGAL CONTENT BLOCKED] Consulta ilícita o violenta detectada en cliente ${clientId}: "${text.substring(0, 50)}..."`);
      return {
        allowed: false,
        reason: "ILLEGAL_CONTENT",
        message: "No se atienden consultas sobre actividades ilícitas o violentas. Este canal está destinado exclusivamente a la asesoría de servicios de 77 Studio.",
      };
    }
  }

  // 7. Detección de Consultas Ajenas / Trivia Externa / Soporte de Dispositivos Ajenos
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(text)) {
      console.warn(`🛡️ [OFF_TOPIC BLOCKED] Consulta ajena detectada por guardrail en cliente ${clientId}: "${text.substring(0, 50)}..."`);
      return {
        allowed: false,
        reason: "OFF_TOPIC",
        message: "Como asesora comercial de 77 Studio, mi función es orientarte exclusivamente sobre nuestros servicios de desarrollo web, marketing digital, automatizaciones con IA y productos digitales para empresas. ¿En qué proyecto o requerimiento de tu negocio te podemos apoyar?",
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
