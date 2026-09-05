import {
  getBaseInstructions,
  getSubInstruction,
  getInstructionsForChannel,
  invalidateInstructionsCache,
} from "./instructions.js";

async function runTests() {
  console.log("🔍 [TEST] Iniciando pruebas del Módulo de Instrucciones y Sub-Instrucciones...");

  // 1. Validar Instrucciones Base
  console.log("\n🧪 [TEST 1] Cargar Instrucciones Base");
  const base = getBaseInstructions();
  if (!base || !base.includes("Sofía") || !base.includes("77 Studio")) {
    throw new Error("❌ Falló la carga de instrucciones base.");
  }
  if (!base.includes("PROHIBIDO PREGUNTAR PRESUPUESTO")) {
    throw new Error("❌ Las directrices base deben incluir la política de presupuesto.");
  }
  console.log("   ✅ Instrucciones base cargadas con éxito (longitud:", base.length, "caracteres)");

  // 2. Validar Sub-Instrucción Kapso (WhatsApp)
  console.log("\n🧪 [TEST 2] Sub-Instrucción para WhatsApp (Kapso)");
  const kapsoSub = getSubInstruction("kapso");
  if (!kapsoSub || !kapsoSub.includes("WhatsApp") || !kapsoSub.includes("Reglas Estrictas de Comunicación")) {
    throw new Error("❌ Falló la carga de la sub-instrucción para Kapso.");
  }
  if (!kapsoSub.includes("PROHIBIDO USAR ENLACES MARKDOWN")) {
    throw new Error("❌ La sub-instrucción de Kapso debe prohibir enlaces markdown.");
  }
  if (!kapsoSub.includes("calendar.app.google") || !kapsoSub.includes("+57 314 8490955") || !kapsoSub.includes("+1 (202) 933-7792")) {
    throw new Error("❌ La sub-instrucción de Kapso debe incluir los números de Dirección Comercial y Calendar.");
  }
  console.log("   ✅ Sub-instrucción de Kapso cargada con éxito (longitud:", kapsoSub.length, "caracteres)");

  // 3. Validar Sub-Instrucción Web
  console.log("\n🧪 [TEST 3] Sub-Instrucción para Chat Web");
  const webSub = getSubInstruction("web");
  if (!webSub || !webSub.includes("Chat Web") || !webSub.includes("[/marketing](/marketing)")) {
    throw new Error("❌ Falló la carga de la sub-instrucción para Web.");
  }
  if (!webSub.includes("calendar.app.google")) {
    throw new Error("❌ La sub-instrucción Web debe incluir el enlace a Calendar.");
  }
  console.log("   ✅ Sub-instrucción Web cargada con éxito (longitud:", webSub.length, "caracteres)");

  // 4. Validar Composición de Canal Kapso
  console.log("\n🧪 [TEST 4] Composición de Instrucciones para Canal Kapso");
  const kapsoFull = getInstructionsForChannel("kapso");
  if (!kapsoFull.includes("Sofía") || !kapsoFull.includes("DIRECTRICES ESPECÍFICAS DE CANAL (KAPSO)")) {
    throw new Error("❌ La composición para Kapso no contiene la base o el encabezado de canal.");
  }
  if (!kapsoFull.includes("Máximo 2 a 3 líneas")) {
    throw new Error("❌ La composición para Kapso no contiene la directriz de extensión.");
  }
  console.log("   ✅ Composición Kapso validada correctamente (longitud:", kapsoFull.length, "caracteres)");

  // 5. Validar Composición de Canal Web
  console.log("\n🧪 [TEST 5] Composición de Instrucciones para Canal Web");
  const webFull = getInstructionsForChannel("web");
  if (!webFull.includes("Sofía") || !webFull.includes("DIRECTRICES ESPECÍFICAS DE CANAL (WEB)")) {
    throw new Error("❌ La composición para Web no contiene la base o el encabezado de canal.");
  }
  console.log("   ✅ Composición Web validada correctamente (longitud:", webFull.length, "caracteres)");

  // 6. Validar Resiliencia con Canal Desconocido
  console.log("\n🧪 [TEST 6] Fallback para canal no registrado");
  const unknownFull = getInstructionsForChannel("telegram");
  if (!unknownFull || !unknownFull.includes("Sofía")) {
    throw new Error("❌ Falló fallback con canal desconocido.");
  }
  if (unknownFull.includes("DIRECTRICES ESPECÍFICAS DE CANAL (TELEGRAM)")) {
    throw new Error("❌ No debería añadir sección vacía para un canal sin sub-instrucción.");
  }
  console.log("   ✅ Fallback a base exitoso.");

  // 7. Validar Invalidador de Caché
  console.log("\n🧪 [TEST 7] Invalidador de Caché");
  invalidateInstructionsCache();
  const basePostInvalidate = getBaseInstructions();
  if (!basePostInvalidate || !basePostInvalidate.includes("Sofía")) {
    throw new Error("❌ Falló recarga tras invalidación de caché.");
  }
  console.log("   ✅ Caché invalidado y recargado correctamente.");

  console.log("\n🎉 ¡TODAS LAS PRUEBAS DE SUB-INSTRUCCIONES PASARON EXITOSAMENTE!");
}

runTests().catch((err) => {
  console.error("❌ Error ejecutando tests de instrucciones:", err);
  process.exit(1);
});
