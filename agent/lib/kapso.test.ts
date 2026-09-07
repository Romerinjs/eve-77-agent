import { formatWhatsAppResponse, prepareWhatsAppOutbound } from "../channels/kapso.js";

async function runKapsoTests() {
  console.log("🧪 [TEST] Iniciando pruebas de sanitización y botones interactivos de WhatsApp (Kapso)...");

  // CASO 1: Respuesta con link feo de wa.me que reportó el usuario
  const uglyRawResponse = `Esteban Pantoja es nuestro *Desarrollador de Software* en 77 Studio, encargado de liderar el desarrollo de plataformas web, automatizaciones e integraciones tecnológicas.

Para comunicarte con nuestro equipo o coordinar un proyecto con el área de tecnología, manejamos la atención a través de nuestros canales oficiales:

* *WhatsApp (Dirección Comercial):* +57 314 8490955: https://wa.me/573148490955?text=Hola%2077%20Studio%20%20Quisiera%20conversar%20sobre%20un%20proyecto
* *Agendar llamada de diagnóstico (15 min):* https://calendar.app.google/9ygzNzhLH5Gy7iwz6

¿Tienes alguna consulta técnica o te gustaría revisar una propuesta para tu empresa? Cuéntame y te ayudo a canalizarlo de inmediato.`;

  const { cleanText, cta } = prepareWhatsAppOutbound(uglyRawResponse);

  console.log("\n📄 Texto resultante sanitizado:");
  console.log(cleanText);

  // 1. Validar que el link feo de wa.me haya desaparecido por completo
  if (cleanText.includes("wa.me") || cleanText.includes("573148490955?text=")) {
    throw new Error("❌ Error: El link feo de wa.me no fue eliminado del texto.");
  }
  console.log("✅ Link redundante de wa.me eliminado con éxito.");

  // 2. Validar que la URL de Calendar se haya extraído como botón interactivo
  if (!cta || cta.label !== "Agendar Diagnóstico" || !cta.url.includes("calendar.app.google")) {
    throw new Error(`❌ Error: Botón CTA no extraído correctamente: ${JSON.stringify(cta)}`);
  }
  console.log(`✅ Botón interactivo extraído: [${cta.label}] -> ${cta.url}`);

  // 3. Validar que la URL cruda no ensucie el texto final
  if (cleanText.includes("https://calendar.app.google/")) {
    throw new Error("❌ Error: La URL cruda de Calendar todavía está presente en el cuerpo del texto.");
  }
  console.log("✅ El cuerpo del texto quedó limpio de URLs crudas.");

  // 4. Validar límite de caracteres de la etiqueta del botón (Meta WhatsApp máx 20 caracteres)
  if (cta.label.length > 20) {
    throw new Error(`❌ Error: La etiqueta del botón excede el límite de 20 caracteres de WhatsApp: "${cta.label}" (${cta.label.length})`);
  }
  console.log(`✅ Longitud de etiqueta de botón válida (${cta.label.length}/20 chars).`);

  // CASO 2: Mensaje con asteriscos dobles multilínea y viñeta huérfana reportado en la captura
  console.log("\n🧪 [TEST] Caso 2: Mensaje con asteriscos envolventes multilínea y viñeta huérfana de WhatsApp...");
  const rawFromScreenshot1 = `**¡Hola, Romer! Buenas tardes.

¿Cómo estás? Quedo muy atenta por si te gustaría que agendemos la llamada de diagnóstico de 15 minutos para estructurar las estrategias de tu software y de tu restaurante, o si prefieres que continuemos conversando directamente por WhatsApp.

- Escribir por WhatsApp:

¿Cómo prefieres avanzar?**`;

  const cleanScreenshot1 = formatWhatsAppResponse(rawFromScreenshot1);
  console.log("📄 Resultado Caso 2:\n" + cleanScreenshot1);

  if (cleanScreenshot1.startsWith("**") || cleanScreenshot1.endsWith("**")) {
    throw new Error("❌ Error: Los asteriscos dobles envolventes multilínea no fueron eliminados.");
  }
  if (cleanScreenshot1.includes("Escribir por WhatsApp")) {
    throw new Error("❌ Error: La viñeta huérfana '- Escribir por WhatsApp:' no fue eliminada.");
  }
  console.log("✅ Asteriscos multilínea y viñeta huérfana eliminados con éxito en Caso 2.");

  // CASO 3: Mensaje 2 de la captura con '- Hablar por WhatsApp:**'
  console.log("\n🧪 [TEST] Caso 3: Mensaje con '- Hablar por WhatsApp:**'...");
  const rawFromScreenshot2 = `**¡Hola, Romer! Todo muy bien por acá, ¡muchas gracias por preguntar! ¿Tú qué tal?

Sigo súper atenta para ayudarte con la estrategia de tus dos negocios (el software y el restaurante).

¿Pudiste revisar los horarios para la llamada estratégica de 15 minutos, o prefieres que lo coordinemos directamente por WhatsApp?

- Hablar por WhatsApp:**`;

  const cleanScreenshot2 = formatWhatsAppResponse(rawFromScreenshot2);
  console.log("📄 Resultado Caso 3:\n" + cleanScreenshot2);

  if (cleanScreenshot2.startsWith("**") || cleanScreenshot2.endsWith("**")) {
    throw new Error("❌ Error: Asteriscos al final de Caso 3 no fueron limpiados.");
  }
  if (cleanScreenshot2.includes("Hablar por WhatsApp")) {
    throw new Error("❌ Error: La viñeta huérfana '- Hablar por WhatsApp:' no fue eliminada.");
  }
  // CASO 4: Mensaje con números de teléfono de WhatsApp, paréntesis vacíos y asteriscos huérfanos
  console.log("\n🧪 [TEST] Caso 4: Mensaje con números telefónicos redundantes, () y asteriscos huérfanos...");
  const rawFromScreenshot3 = `*¡Excelente, Romer! Buenas tardes.

Será un gusto reunirnos contigo para revisar a detalle la estrategia de software y marketing de tus proyectos (el software y el restaurante).

Puedes agendar directamente tu *Llamada Estratégica de Diagnóstico (15 min por Google Meet)* en el horario que mejor te convenga a través de nuestro agenda oficial
**
https://calendar.app.google/9ygzNzhLH5Gy7iwz6

Si prefieres que coordinemos la agenda o un espacio directamente por chat, escríbenos a nuestros canales oficiales de WhatsApp

- 🇨🇴 Chat WhatsApp LATAM (+57 314 8490955) ()
- 🇺🇸 Chat WhatsApp USA (+1 202 933 7792) ()

¡Quedamos atentos a tu agendamiento para reunirnos!**`;

  const { cleanText: cleanScreenshot3, cta: cta3 } = prepareWhatsAppOutbound(rawFromScreenshot3);
  console.log("📄 Resultado Caso 4:\n" + cleanScreenshot3);

  if (cleanScreenshot3.includes("+57 314 8490955") || cleanScreenshot3.includes("+1 202 933 7792")) {
    throw new Error("❌ Error: Los números telefónicos redundantes no fueron eliminados.");
  }
  if (cleanScreenshot3.includes("Chat WhatsApp LATAM") || cleanScreenshot3.includes("Chat WhatsApp USA")) {
    throw new Error("❌ Error: Los canales redundantes de WhatsApp no fueron eliminados.");
  }
  if (cleanScreenshot3.includes("()")) {
    throw new Error("❌ Error: Quedaron paréntesis vacíos '()' en el texto.");
  }
  if (/^\s*\*+\s*$/m.test(cleanScreenshot3)) {
    throw new Error("❌ Error: Quedó una línea huérfana de asteriscos '**' en el texto.");
  }
  if (!cta3 || !cta3.url.includes("calendar.app.google")) {
    throw new Error("❌ Error: No se extrajo el botón CTA de Calendar en Caso 4.");
  }
  console.log("✅ Caso 4 verificado: teléfonos eliminados, () eliminados, asteriscos huérfanos eliminados y botón extraído.");

  console.log("\n🎉 ¡TODAS LAS PRUEBAS DE SANITIZACIÓN Y BOTONES PASARON CON ÉXITO!");
  process.exit(0);
}

runKapsoTests().catch((err) => {
  console.error("❌ Error en pruebas:", err);
  process.exit(1);
});
