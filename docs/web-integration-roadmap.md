# Hoja de Ruta de Integración: Frontend Web Astro (`77.studio`)

Esta guía técnica describe cómo integrar el frontend del sitio web oficial de **77 Studio** (desarrollado en **Astro**) con el backend del agente de conocimiento **`eve-77-agent`** mediante el adaptador oficial de Chat SDK (`@chat-adapter/web`).

---

## 1. Arquitectura de Conexión

```
   [Visitante en 77.studio]
              │
              ▼
   [<AIChatWidget /> (React Island)]
              │
              ▼ (useChat hook de @chat-adapter/web/react)
   POST https://[EVE_HOST]/eve/v1/web
              │
              ▼
   [eve-77-agent Engine (chatSdkChannel)]
              │
   ├── Tool: search_knowledge (Lectura en RAM de 77/*.mdx)
   └── Streaming Response (Markdown enriquecido)
```

---

## 2. Instalación en el Repositorio de Astro Web

En el repositorio de la aplicación web de Astro, instala las dependencias de Chat SDK para React:

```bash
npm install @chat-adapter/web ai react react-dom
```

---

## 3. Componente React: Widget de Chat Inteligente (`AIChatWidget.tsx`)

Crea el componente de chat en `src/components/chat/AIChatWidget.tsx`:

```tsx
import React, { useState } from "react";
import { useChat } from "@chat-adapter/web/react";

interface AIChatWidgetProps {
  apiEndpoint?: string;
}

export default function AIChatWidget({
  apiEndpoint = "http://localhost:3000/eve/v1/web",
}: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const { messages, sendMessage, status, stop } = useChat({
    api: apiEndpoint,
    threadId: "77studio-web-thread",
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || status === "submitted" || status === "streaming") return;

    sendMessage({
      text: inputValue,
    });
    setInputValue("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Ventana del Chat */}
      {isOpen && (
        <div className="mb-4 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 sm:w-[420px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/80">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED] text-white font-bold text-sm shadow-md">
                77
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm dark:text-white">
                  Consultor 77 Studio
                </h3>
                <p className="text-xs text-emerald-500 font-medium">● En línea</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Cerrar chat"
            >
              ✕
            </button>
          </div>

          {/* Lista de Mensajes */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 text-xs px-4">
                <p className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                  ¡Hola! 👋 Soy el asistente de 77 Studio.
                </p>
                <p className="mb-4">
                  Pregúntame sobre Marketing, Desarrollo Web, Automatización con IA o Productos Digitales.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() =>
                      sendMessage({ text: "¿Qué servicios de desarrollo web ofrecen?" })
                    }
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 hover:border-[#7C3AED] hover:text-[#7C3AED] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    🚀 Desarrollo Web
                  </button>
                  <button
                    onClick={() =>
                      sendMessage({ text: "¿Cómo automatizan procesos con IA y CRM?" })
                    }
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 hover:border-[#7C3AED] hover:text-[#7C3AED] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    ⚡ IA + Automatización
                  </button>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    message.role === "user"
                      ? "bg-[#7C3AED] text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-bl-none"
                  }`}
                >
                  {message.parts.map((part, idx) =>
                    part.type === "text" ? <p key={idx} className="whitespace-pre-wrap">{part.text}</p> : null,
                  )}
                </div>
              </div>
            ))}

            {status === "streaming" && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span className="animate-pulse">Escribiendo...</span>
                <button
                  type="button"
                  onClick={stop}
                  className="ml-2 underline text-red-400 hover:text-red-500"
                >
                  Detener
                </button>
              </div>
            )}
          </div>

          {/* Formulario de Entrada */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe tu consulta..."
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 focus:border-[#7C3AED] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || status === "streaming"}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED] text-white transition hover:bg-[#6D28D9] disabled:opacity-50"
              aria-label="Enviar"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Botón Flotante Disparador */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7C3AED] text-white shadow-xl transition-all duration-200 hover:scale-105 hover:bg-[#6D28D9] active:scale-95"
        aria-label="Abrir asistente de IA"
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}
```

---

## 4. Inclusión en Astro Layout (`Layout.astro`)

En `src/layouts/Layout.astro` de tu proyecto Astro:

```astro
---
import AIChatWidget from '../components/chat/AIChatWidget';
const EVE_API_URL = import.meta.env.PUBLIC_EVE_API_URL || "https://agent.77.studio/eve/v1/web";
---

<!doctype html>
<html lang="es">
  <head>
    <!-- Metadatos y estilos -->
  </head>
  <body>
    <slot />
    <!-- Widget hidratado en el cliente -->
    <AIChatWidget client:idle apiEndpoint={EVE_API_URL} />
  </body>
</html>
```

---

## 5. Variables de Entorno en el Frontend

En el `.env` del repositorio web:
```env
PUBLIC_EVE_API_URL=https://agent.77.studio/eve/v1/web
```
