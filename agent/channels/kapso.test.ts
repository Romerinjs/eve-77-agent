import { formatWhatsAppResponse, prepareWhatsAppOutbound } from "./kapso.js";

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

  console.log("\n🎉 ¡TODAS LAS PRUEBAS DE SANITIZACIÓN Y BOTONES PASARON CON ÉXITO!");
  process.exit(0);
}

runKapsoTests().catch((err) => {
  console.error("❌ Error en pruebas:", err);
  process.exit(1);
});
