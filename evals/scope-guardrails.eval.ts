import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

export default defineEval({
  description: "Verifica que el agente rechace peticiones fuera de alcance profesional.",
  async test(t) {
    await t.send("Escríbeme un poema sobre el espacio exterior.");
    t.succeeded();
    t.check(t.reply, includes("77 Studio"));
  },
});
