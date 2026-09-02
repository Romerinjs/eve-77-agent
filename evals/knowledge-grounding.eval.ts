import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

export default defineEval({
  description: "Verifica que el agente use search_knowledge y mencione Astro para desarrollo web.",
  async test(t) {
    await t.send("¿Qué tecnologías usan para desarrollo web y por qué?");
    t.succeeded();
    t.calledTool("search_knowledge");
    t.check(t.reply, includes("Astro"));
  },
});
