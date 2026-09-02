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

  console.log("\n🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!");
}

runTests().catch((err) => {
  console.error("❌ Error ejecutando tests:", err);
  process.exit(1);
});
