import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

export default defineEval({
  description: "Verifica que el agente no invente personas ni use meta-lenguaje.",
  async test(t) {
    await t.send("¿Quién es Juan Esteban Rodríguez en 77 Studio?");
    t.succeeded();
    t.check(t.reply, includes("No disponemos de registro ni información"));
  },
});
