import { getKnowledgeCache, searchKnowledge } from "./knowledge.js";

async function runTests() {
  console.log("🔍 [TEST] Iniciando pruebas del Motor de Conocimiento 77 Studio...");

  // 1. Cargar caché
  const docs = await getKnowledgeCache();
  console.log(`✅ Documentos indexados en RAM: ${docs.length}`);
  
  if (docs.length === 0) {
    throw new Error("❌ Error: No se encontraron documentos indexados en el caché.");
  }

  for (const doc of docs) {
    console.log(`   - [${doc.category ?? "general"}] ${doc.slug} -> "${doc.title}" (Keywords: ${doc.keywords.length})`);
  }

  // 2. Test Búsqueda: Marketing & Meta Ads
  console.log("\n🧪 [TEST 1] Búsqueda: 'meta ads'");
  const resMarketing = await searchKnowledge({ query: "meta ads" });
  console.log(`   Resultados encontrados: ${resMarketing.total}`);
  const topMarketing = resMarketing.documents[0];
  console.log(`   Top match: ${topMarketing?.slug} (Score: ${topMarketing?.score})`);
  if (!topMarketing || !topMarketing.slug.includes("marketing")) {
    throw new Error(`❌ Falló match esperado para 'meta ads', recibido: ${topMarketing?.slug}`);
  }
  console.log("   ✅ Match correcto con servicios/marketing");

  // 3. Test Búsqueda: Desarrollo Web
  console.log("\n🧪 [TEST 2] Búsqueda: 'desarrollo web'");
  const resWeb = await searchKnowledge({ query: "desarrollo web" });
  const topWeb = resWeb.documents[0];
  console.log(`   Top match: ${topWeb?.slug} (Score: ${topWeb?.score})`);
  if (!topWeb || !topWeb.slug.includes("web")) {
    throw new Error(`❌ Falló match esperado para 'desarrollo web', recibido: ${topWeb?.slug}`);
  }
  console.log("   ✅ Match correcto con servicios/web");

  // 4. Test Búsqueda: Automatización CRM
  console.log("\n🧪 [TEST 3] Búsqueda: 'automatizacion crm'");
  const resIA = await searchKnowledge({ query: "automatizacion crm" });
  const topIA = resIA.documents[0];
  console.log(`   Top match: ${topIA?.slug} (Score: ${topIA?.score})`);
  if (!topIA || !topIA.slug.includes("ia-automatizacion")) {
    throw new Error(`❌ Falló match esperado para 'automatizacion crm', recibido: ${topIA?.slug}`);
  }
  console.log("   ✅ Match correcto con servicios/ia-automatizacion");

  // 5. Test Búsqueda: Audiencia Nuevos Clientes
  console.log("\n🧪 [TEST 4] Búsqueda con Audiencia: 'nuevos-clientes'");
  const resAudience = await searchKnowledge({ audience: "nuevos-clientes" });
  const topAudience = resAudience.documents[0];
  console.log(`   Top match: ${topAudience?.slug} (Score: ${topAudience?.score})`);
  if (!topAudience || !topAudience.slug.includes("nuevos-clientes")) {
    throw new Error(`❌ Falló match de audiencia para nuevos clientes, recibido: ${topAudience?.slug}`);
  }
  console.log("   ✅ Boost de audiencia correcto para audiencias/nuevos-clientes");

  // 6. Test Consulta por Slug Exacto
  console.log("\n🧪 [TEST 5] Consulta por Slug Exacto: 'servicios/productos-digitales'");
  const resSlug = await searchKnowledge({ slug: "servicios/productos-digitales" });
  if (resSlug.total === 0 || resSlug.documents[0]?.slug !== "servicios/productos-digitales") {
    throw new Error("❌ Falló búsqueda por slug exacto");
  }
  console.log(`   ✅ Documento encontrado: "${resSlug.documents[0]?.title}"`);

  // 7. Test Búsqueda Equipo: Esteban Pantoja (Query conversacional)
  console.log("\n🧪 [TEST 6] Búsqueda: 'pero no sabes nada de esteban pantoja?'");
  const resEstebanConv = await searchKnowledge({ query: "pero no sabes nada de esteban pantoja?" });
  const topEsteban = resEstebanConv.documents[0];
  console.log(`   Resultados encontrados: ${resEstebanConv.total}`);
  console.log(`   Top match: ${topEsteban?.slug} (Score: ${topEsteban?.score})`);
  if (!topEsteban || topEsteban.slug !== "equipo/esteban") {
    throw new Error(`❌ Falló match esperado para Esteban Pantoja, recibido: ${topEsteban?.slug}`);
  }
  console.log("   ✅ Match correcto con equipo/esteban");

  // 8. Test Resiliencia ante Slug Alucinado/Aproximado
  console.log("\n🧪 [TEST 7] Búsqueda con Slug Alucinado: query='Esteban Pantoja', slug='equipo/esteban-pantoja'");
  const resEstebanAlucinado = await searchKnowledge({ query: "Esteban Pantoja", slug: "equipo/esteban-pantoja" });
  const topAlucinado = resEstebanAlucinado.documents[0];
  console.log(`   Resultados encontrados: ${resEstebanAlucinado.total}`);
  console.log(`   Top match: ${topAlucinado?.slug} (Score: ${topAlucinado?.score})`);
  if (!topAlucinado || topAlucinado.slug !== "equipo/esteban") {
    throw new Error(`❌ Falló match resiliente para slug alucinado, recibido: ${topAlucinado?.slug}`);
  }
  console.log("   ✅ Resiliencia confirmada: recuperó equipo/esteban a pesar del slug alucinado");

  // 9. Test Persona Desconocida (debe dar 0 resultados para permitir respuesta corporativa según instrucciones)
  console.log("\n🧪 [TEST 8] Búsqueda Persona Desconocida: query='Carlos Perez'");
  const resDesconocido = await searchKnowledge({ query: "Carlos Perez" });
  console.log(`   Resultados encontrados: ${resDesconocido.total}`);
  if (resDesconocido.total !== 0) {
    throw new Error(`❌ Se esperaban 0 resultados para persona inexistente, recibido: ${resDesconocido.total}`);
  }
  console.log("   ✅ 0 resultados confirmados para persona no registrada");

  console.log("\n🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!");
}

runTests().catch((err) => {
  console.error("❌ Error ejecutando tests:", err);
  process.exit(1);
});
