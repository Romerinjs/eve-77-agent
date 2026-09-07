import { MessageDebouncer } from "./debouncer.js";

async function testDebouncer() {
  console.log("🧪 [TEST] Iniciando prueba del Message Debouncer...");

  // CASO 1: Ráfaga de 3 mensajes consecutivos con imágenes
  let flushCount = 0;
  let receivedText = "";
  let receivedImages: string[] = [];

  const debouncer = new MessageDebouncer(500); // 500ms para pruebas rápidas
  const threadId = "test-thread-whatsapp-123";

  // Enviar mensaje 1
  const p1 = debouncer.enqueue(
    threadId,
    {
      text: "Hola",
      messageId: "msg-1",
      senderName: "Carlos",
      timestamp: Date.now(),
    },
    async (_tid, aggText, imgs) => {
      flushCount++;
      receivedText = aggText;
      receivedImages = imgs;
    }
  );

  // Enviar mensaje 2 a los 100ms
  await new Promise((r) => setTimeout(r, 100));
  const p2 = debouncer.enqueue(
    threadId,
    {
      text: "¿Tienen servicio de desarrollo web en Astro?",
      messageId: "msg-2",
      senderName: "Carlos",
      timestamp: Date.now(),
    },
    async (_tid, aggText, imgs) => {
      flushCount++;
      receivedText = aggText;
      receivedImages = imgs;
    }
  );

  // Enviar mensaje 3 con imagen a los 200ms
  await new Promise((r) => setTimeout(r, 100));
  const p3 = debouncer.enqueue(
    threadId,
    {
      text: "Adjunto referencia de mi web actual",
      imageUrls: ["https://example.com/mock-landing.png"],
      messageId: "msg-3",
      senderName: "Carlos",
      timestamp: Date.now(),
    },
    async (_tid, aggText, imgs) => {
      flushCount++;
      receivedText = aggText;
      receivedImages = imgs;
    }
  );

  // Esperar a que las promesas de enqueue se resuelvan tras el flush
  await Promise.all([p1, p2, p3]);

  if (flushCount !== 1) {
    throw new Error(`❌ Se esperaba exactamente 1 ejecución consolidada, pero se recibieron ${flushCount}`);
  }

  const expectedLines = [
    "Hola",
    "¿Tienen servicio de desarrollo web en Astro?",
    "Adjunto referencia de mi web actual",
  ];

  for (const line of expectedLines) {
    if (!receivedText.includes(line)) {
      throw new Error(`❌ Falta línea en texto acumulado: "${line}". Texto recibido: "${receivedText}"`);
    }
  }

  if (receivedImages.length !== 1 || receivedImages[0] !== "https://example.com/mock-landing.png") {
    throw new Error(`❌ Imagen no acumulada correctamente: ${JSON.stringify(receivedImages)}`);
  }

  console.log(`✅ [CASO 1] ¡Prueba de Debouncer con 3 mensajes e imagen superada!`);
  console.log(`   - Ejecuciones totales: ${flushCount}`);
  console.log(`   - Texto consolidado:\n${receivedText.split("\n").map(l => "     > " + l).join("\n")}`);

  // CASO 2: Simulación exacta de WhatsApp (Romer: Consulta doble 'Bueno bueno que que llamada' + 'Que sabes de Tania Pérez?')
  console.log("\n🧪 [CASO 2] Simulación caso real de usuario (Consulta doble simultánea)...");
  let realFlushCount = 0;
  let realAggregatedText = "";

  const realThreadId = "whatsapp-romer-57314";
  const pReal1 = debouncer.enqueue(
    realThreadId,
    {
      text: "Bueno bueno que que llamada",
      messageId: "wa-msg-101",
      senderName: "Romer",
      timestamp: Date.now(),
    },
    async (_tid, aggText) => {
      realFlushCount++;
      realAggregatedText = aggText;
    }
  );

  await new Promise((r) => setTimeout(r, 150));

  const pReal2 = debouncer.enqueue(
    realThreadId,
    {
      text: "Que sabes de Tania Pérez?",
      messageId: "wa-msg-102",
      senderName: "Romer",
      timestamp: Date.now(),
    },
    async (_tid, aggText) => {
      realFlushCount++;
      realAggregatedText = aggText;
    }
  );

  await Promise.all([pReal1, pReal2]);

  if (realFlushCount !== 1) {
    throw new Error(`❌ Falló consolidación en caso real: se ejecutaron ${realFlushCount} veces en vez de 1`);
  }

  if (!realAggregatedText.includes("Bueno bueno que que llamada") || !realAggregatedText.includes("Que sabes de Tania Pérez?")) {
    throw new Error(`❌ El texto consolidado no contiene ambas preguntas: "${realAggregatedText}"`);
  }

  console.log(`✅ [CASO 2] ¡Consulta doble consolidada con éxito en un solo turno!`);
  console.log(`   - Texto unificado:\n${realAggregatedText.split("\n").map(l => "     > " + l).join("\n")}`);

  // CASO 3: Detección y descarte de mensaje duplicado (reintento de webhook)
  console.log("\n🧪 [CASO 3] Detección de mensajes duplicados por reintentos de red...");
  let dupFlushCount = 0;
  let dupText = "";

  const dupThreadId = "whatsapp-dup-test";
  const pDup1 = debouncer.enqueue(
    dupThreadId,
    {
      text: "Mensaje único original",
      messageId: "same-msg-id-999",
      senderName: "Ana",
      timestamp: Date.now(),
    },
    async (_tid, aggText) => {
      dupFlushCount++;
      dupText = aggText;
    }
  );

  // Intentar meter el mismo messageId de inmediato
  const pDup2 = debouncer.enqueue(
    dupThreadId,
    {
      text: "Mensaje único original",
      messageId: "same-msg-id-999",
      senderName: "Ana",
      timestamp: Date.now(),
    },
    async (_tid, aggText) => {
      dupFlushCount++;
      dupText = aggText;
    }
  );

  await Promise.all([pDup1, pDup2]);

  if (dupFlushCount !== 1 || dupText !== "Mensaje único original") {
    throw new Error(`❌ No se deduplicó correctamente: flushCount=${dupFlushCount}, text="${dupText}"`);
  }
  console.log(`✅ [CASO 3] Mensaje duplicado filtrado exitosamente.`);

  // CASO 4: Mensaje recibido MIENTRAS se procesa la IA (cola secuencial, cero colisiones)
  console.log("\n🧪 [CASO 4] Mensaje recibido mientras la IA procesa (cola segura sin llamadas simultáneas)...");
  let executions = 0;
  const executionTexts: string[] = [];

  const busyThreadId = "whatsapp-busy-flow";
  const debouncerFast = new MessageDebouncer(100);

  // Turno 1 con procesamiento simulado de 300ms
  const pTurn1 = debouncerFast.enqueue(
    busyThreadId,
    {
      text: "Pregunta inicial",
      messageId: "turn-msg-1",
      senderName: "Romer",
      timestamp: Date.now(),
    },
    async (_tid, aggText) => {
      executions++;
      executionTexts.push(aggText);
      // Simular latencia de LLM
      await new Promise((r) => setTimeout(r, 200));
    }
  );

  // Mensaje que llega a los 150ms (cuando el turno 1 está en plena ejecución del LLM)
  await new Promise((r) => setTimeout(r, 150));
  const pTurn2 = debouncerFast.enqueue(
    busyThreadId,
    {
      text: "Mensaje complementario enviado mientras pensaba",
      messageId: "turn-msg-2",
      senderName: "Romer",
      timestamp: Date.now(),
    },
    async (_tid, aggText) => {
      executions++;
      executionTexts.push(aggText);
    }
  );

  await Promise.all([pTurn1, pTurn2]);

  if (executions !== 2) {
    throw new Error(`❌ Se esperaban 2 ejecuciones secuenciales, pero hubo ${executions}`);
  }

  if (executionTexts[0] !== "Pregunta inicial" || executionTexts[1] !== "Mensaje complementario enviado mientras pensaba") {
    throw new Error(`❌ Los textos secuenciales no coinciden: ${JSON.stringify(executionTexts)}`);
  }

  console.log(`✅ [CASO 4] Cola secuencial validada: 2 turnos limpios sin solapamiento de IA.`);

  console.log("\n🎉 ¡TODAS LAS PRUEBAS DEL DEBOUNCER PASARON CON ÉXITO!");
}

testDebouncer().catch((e) => {
  console.error("❌ Error en prueba:", e);
  process.exit(1);
});
