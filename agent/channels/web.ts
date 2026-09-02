import { createMemoryState } from "@chat-adapter/state-memory";
import { createWebAdapter } from "@chat-adapter/web";
import type { Message, Thread } from "chat";
import { chatSdkChannel } from "eve/channels/chat-sdk";

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
});

bot.onDirectMessage(async (thread: Thread, message: Message) => {
  await send(message.text, { thread });
});

export default channel;
