# Hoja de Ruta de Integración: Sofía (Agente de WhatsApp)

Esta guía técnica explica cómo conectar el bot de WhatsApp existente (**Sofía**, alojado en su propio servidor Node.js) con **`eve-77-agent`** para consultar el núcleo central de conocimiento de 77 Studio, armar propuestas y responder a prospectos en WhatsApp.

---

## 1. Flujo de Comunicación API

```
   [Cliente escribe en WhatsApp]
                 │
                 ▼
   [Servidor de Sofía (Node.js / Baileys / Twilio)]
                 │
                 ▼ 1. POST /eve/v1/session (Crea/reutiliza sesión)
   [eve-77-agent Server]
                 │
                 │ 2. Devuelve HTTP 202 Accepted + sessionId
                 ▼
   [Servidor de Sofía]
                 │
                 ▼ 3. GET /eve/v1/session/:sessionId/stream (Stream NDJSON)
   [eve-77-agent Server]
                 │
                 │ 4. Ejecuta Tool search_knowledge sobre MDX en RAM
                 │ 5. Emite eventos hasta "message.completed" (finishReason: "stop")
                 ▼
   [Servidor de Sofía]
                 │
                 ▼ 6. Envía respuesta final formateada al chat de WhatsApp
   [Cliente recibe respuesta en WhatsApp]
```

---

## 2. Cliente de Integración para Sofía (`eveClient.js`)

Copia y utiliza este módulo en el repositorio del servidor de Sofía:

```javascript
// eveClient.js (Node.js 20+)
import { randomUUID } from "node:crypto";

const EVE_BASE_URL = process.env.EVE_BASE_URL || "http://localhost:3000";
const EVE_TOKEN = process.env.EVE_TOKEN || "";

function getHeaders() {
  return {
    "content-type": "application/json",
    ...(EVE_TOKEN ? { authorization: `Bearer ${EVE_TOKEN}` } : {}),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Inicia una sesión en eve con el mensaje del usuario de WhatsApp.
 */
async function startSession(message) {
  const operationId = randomUUID();
  const res = await fetch(`${EVE_BASE_URL}/eve/v1/session`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      message: `[CANAL: WHATSAPP] ${message}`,
      operationId,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Error al crear sesión en eve (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  if (!data.sessionId) {
    throw new Error("eve no retornó un sessionId válido");
  }
  return data.sessionId;
}

/**
 * Escucha el stream de la sesión hasta que el agente complete su respuesta.
 */
async function readAssistantResponse(sessionId) {
  let streamResponse = null;

  // Reintento breve para asegurar que el inbox de sesión esté listo
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(
      `${EVE_BASE_URL}/eve/v1/session/${encodeURIComponent(sessionId)}/stream`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (res.ok && res.body) {
      streamResponse = res;
      break;
    }

    if (res.status !== 404 && res.status !== 409) {
      const err = await res.text();
      throw new Error(`Error en el stream de eve (${res.status}): ${err}`);
    }

    await sleep(250);
  }

  if (!streamResponse) {
    throw new Error(`El stream de eve no estuvo listo para la sesión ${sessionId}`);
  }

  const reader = streamResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        // Cuando el agente termina su turno
        if (
          event.type === "message.completed" &&
          event.data?.finishReason === "stop"
        ) {
          return event.data.message;
        }
        if (event.type === "turn.failed" || event.type === "session.failed") {
          throw new Error(event.data?.message ?? "Falló el turno de la sesión en eve");
        }
      } catch (err) {
        // Ignorar líneas no JSON parciales
      }
    }
  }

  throw new Error(`eve finalizó el stream sin respuesta para la sesión ${sessionId}`);
}

/**
 * Envía un mensaje de seguimiento dentro de la misma conversación de WhatsApp.
 */
export async function sendFollowUp(sessionId, message) {
  const res = await fetch(
    `${EVE_BASE_URL}/eve/v1/session/${encodeURIComponent(sessionId)}`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        message: `[CANAL: WHATSAPP] ${message}`,
      }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Error al enviar mensaje de seguimiento (${res.status}): ${errorBody}`);
  }

  await res.json();
  return readAssistantResponse(sessionId);
}

/**
 * Función principal para invocar a eve desde Sofía.
 * Guarda y reutiliza el sessionId por cada número de WhatsApp.
 * 
 * @param {string} userMessage - Texto del cliente en WhatsApp
 * @param {string|null} existingSessionId - sessionId previo si ya existe un hilo
 * @returns {Promise<{ sessionId: string, text: string }>}
 */
export async function askEveFromSofia(userMessage, existingSessionId = null) {
  let sessionId = existingSessionId;

  if (!sessionId) {
    sessionId = await startSession(userMessage);
    const text = await readAssistantResponse(sessionId);
    return { sessionId, text };
  } else {
    const text = await sendFollowUp(sessionId, userMessage);
    return { sessionId, text };
  }
}
```

---

## 3. Ejemplo de Uso en el Bot de WhatsApp de Sofía

```javascript
import { askEveFromSofia } from "./eveClient.js";

// Mapa en memoria o base de datos de sesiones por número telefónico
const sessionsByPhone = new Map();

async function handleIncomingWhatsAppMessage(fromPhoneNumber, messageText) {
  const currentSessionId = sessionsByPhone.get(fromPhoneNumber) || null;

  try {
    const { sessionId, text } = await askEveFromSofia(messageText, currentSessionId);
    
    // Guardar sesión para continuar la conversación en el siguiente mensaje
    sessionsByPhone.set(fromPhoneNumber, sessionId);

    // Enviar el texto generado por eve de vuelta al usuario por WhatsApp
    await sendWhatsAppMessage(fromPhoneNumber, text);
  } catch (error) {
    console.error("Error consultando a eve:", error);
    await sendWhatsAppMessage(
      fromPhoneNumber,
      "¡Hola! 👋 Estoy consultando los detalles de tu proyecto con el equipo. En breve te respondo."
    );
  }
}
```
