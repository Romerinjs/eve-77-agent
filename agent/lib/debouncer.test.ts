import { MessageDebouncer } from "./debouncer.js";

async function testDebouncer() {
  console.log("🧪 [TEST] Iniciando prueba del Message Debouncer...");

  let flushCount = 0;
  let receivedText = "";
  let receivedImages: string[] = [];

  const debouncer = new MessageDebouncer(1000); // 1 segundo para el test rápido

  const threadId = "test-thread-whatsapp-123";

  // Enviar mensaje 1
  debouncer.enqueue(
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

  // Enviar mensaje 2 a los 300ms
  await new Promise((r) => setTimeout(r, 300));
  debouncer.enqueue(
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

  // Enviar mensaje 3 con imagen a los 500ms
  await new Promise((r) => setTimeout(r, 200));
  debouncer.enqueue(
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

  console.log("   ⏳ Esperando a que expire el temporizador del debouncer (1.5s)...");
  await new Promise((r) => setTimeout(r, 1500));

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

  console.log(`✅ ¡Prueba de Debouncer superada!`);
  console.log(`   - Ejecuciones totales: ${flushCount}`);
  console.log(`   - Texto consolidado:\n${receivedText.split("\n").map(l => "     > " + l).join("\n")}`);
  console.log(`   - Imágenes acumuladas: ${receivedImages.join(", ")}`);
}

testDebouncer().catch((e) => {
  console.error("❌ Error en prueba:", e);
  process.exit(1);
});
