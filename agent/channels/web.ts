import { createMemoryState } from "@chat-adapter/state-memory";
import { createWebAdapter } from "@chat-adapter/web";
import type { Message, Thread } from "chat";
import { chatSdkChannel } from "eve/channels/chat-sdk";
import { warmKnowledgeCache } from "../lib/knowledge.js";

// Pre-cargar base de conocimiento en RAM al iniciar
warmKnowledgeCache()
  .then(() => {
    console.log("✅ [EVE KNOWLEDGE] Base de conocimiento 77 Studio cargada e indexada en RAM.");
  })
  .catch((err) => {
    console.error("❌ [EVE KNOWLEDGE] Error pre-cargando base de conocimiento:", err);
  });

export const { bot, channel, send } = chatSdkChannel({
  userName: "77 Studio Assistant",
  adapters: {
    web: createWebAdapter({
      userName: "77 Studio Assistant",
      getUser: async (_req: Request) => {
        return {
          id: "anonymous-web-user",
          name: "Visitante Web",
        };
      },
    }),
  },
  state: createMemoryState(),
  streaming: true,
  streamingEditIntervalMs: 250,
});

// 1. Manejador de nuevo mensaje / nuevo hilo entrante desde la web
bot.onNewMention(async (thread: Thread, message: Message) => {
  console.log(`\n💬 [WEB CHAT] Nuevo hilo iniciado por visitante: "${message.text}"`);
  
  // Suscribir el hilo para recibir los siguientes mensajes de la misma conversación
  await thread.subscribe();

  // Iniciar la sesión con el cerebro de eve
  await send(message.text, {
    thread,
    title: "Consulta Web 77 Studio",
  });
});

// 2. Manejador de mensajes de seguimiento en la misma conversación
bot.onSubscribedMessage(async (thread: Thread, message: Message) => {
  console.log(`\n💬 [WEB CHAT] Mensaje de seguimiento: "${message.text}"`);

  // Continuar la sesión existente
  await send(message.text, {
    thread,
  });
});

// 3. Manejador de acciones / botones interactivos
bot.onAction(async (thread: Thread, action: any) => {
  console.log(`🔘 [WEB CHAT] Acción de botón pulsada: ${action?.actionId || action}`);
});

console.log("🚀 [EVE CHANNEL] Canal Web montado en /eve/v1/web listo para recibir conexiones.");

export default channel;
