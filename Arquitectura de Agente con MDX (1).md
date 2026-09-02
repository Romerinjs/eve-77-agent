2/9/26, 16:01 

Arquitectura de Agente para CMS con MDX 

# **Arquitectura de Agente para CMS con MDX** 

https://gemini.google.com/app/e29b8369df657f80 

_User prompt: **You:** necesito conectar un agente que ya tengo en un servicio integrarlo con eve, que necesito para ello? --- **AI:** ¿Quieres integrar ese agente existente **para que eve lo invoque** o **para migrarlo y ejecutarlo dentro de eve**? 1. Invocarlo desde eve mediante una API/servicio externo. 2. Integrarlo como subagente usando el protocolo de agentes externos. 3. Migrar su lógica a un agente nativo de eve. 4. Exponerlo detrás de una ruta de eve para que otros clientes lo consuman. --- **You:** instalo chat SDK y lo conecto con eve instalo chat SDK en astro y hago la interfaz del chat (Únicamente llama a eve) que hace eve 2 opciones Repositorio propio Clonado en web (solo listar los repositorios de información) esta es mas o menos la ruta que tengo, qué me recomiendas segun esa lógica? --- **AI:** Tu arquitectura tiene sentido: **Astro debe ser únicamente la interfaz y eve debe encargarse de la conversación, la selección de la fuente y la lógica de consulta**. Solo cambiaría una cosa: el **Chat SDK de Vercel no es necesario para una interfaz web en Astro**. En eve, Chat SDK está pensado principalmente para conectar adaptadores como Slack, Discord, Telegram o email; para un chat web conviene usar el canal HTTP de eve y `useEveAgent` —o el cliente HTTP de eve si no quieres usar React—. Consulta [Channels](https://eve.dev/docs/channels/overview), [Chat SDK](https://eve.dev/docs/channels/chat-sdk) y [Frontend](https://eve.dev/docs/guides/frontend/overview). ## Arquitectura recomendada ```text Usuario   ↓ Interfaz Astro   ↓ Canal HTTP de eve   ↓ Agente eve   ├── listar repositorios propios   └── listar repositorios disponibles en la web ``` El frontend no debería clonar repositorios ni contener credenciales. Solo debería: - mostrar el chat; - mostrar las dos opciones; - enviar el mensaje a eve; - renderizar la respuesta y el estado de streaming; - conservar el `sessionId` para continuar la conversación. El canal HTTP de eve ya expone las rutas de sesión: ```text POST /eve/v1/session POST /eve/v1/session/:sessionId GET  /eve/v1/session/:sessionId/stream ``` Estas rutas son las que utiliza el frontend para crear sesiones, enviar mensajes y recibir respuestas en streaming. Consulta [eve HTTP channel](https://eve.dev/docs/channels/eve). ## Cómo modelaría las dos opciones En la interfaz puedes mostrar dos botones: ```text [Repositorio propio] [Repositorios web] ``` Cada botón puede enviar una instrucción explícita a eve: ```text Lista los repositorios disponibles en el repositorio propio. ``` o: ```text Lista únicamente los repositorios de información disponibles en la web. ``` En eve crearía una herramienta de solo lectura, por ejemplo: ```ts title="agent/tools/list_repositories.ts" import { defineTool } from "eve/tools"; import { z } from "zod"; export default defineTool({   description:     "Lista repositorios de información. Nunca modifica, crea ni elimina repositorios.",   inputSchema: z.object({     source: z.enum(["own", "web"]),   }),   async execute({ source }) {     const repositories = source === "own"         ? await listOwnRepositories()         : await listWebRepositories();     return repositories.map((repository) => ({       id: repository.id,       name: repository.name,       description: repository.description,       url: repository.url,     }));   }, }); ``` La implementación concreta dependería de dónde estén los datos: - **Repositorio propio:** consultar una API interna, GitHub, GitLab, una base de datos o un catálogo local. - **Repositorios web:** consultar un catálogo de URLs permitidas o una API de búsqueda. - **Si necesitas herramientas externas ya publicadas:** usa una [connection](https://eve.dev/docs/connections). - **Si solo necesitas consultar páginas públicas:** puedes usar `web_search` o `web_fetch`, aunque para un catálogo controlado prefiero una herramienta propia con una lista de dominios permitidos. Las herramientas de eve se ejecutan en el runtime del servidor, donde pueden acceder a `process.env`; no debes enviar tokens desde Astro. Consulta [Tools](https://eve.dev/docs/tools). ## Mi recomendación para tu caso Como inicialmente solo quieres **listar repositorios**, no clonaría nada durante la conversación. Haría esto: 1. Mantener un catálogo de repositorios propios en tu backend o base de datos. 2. Mantener otro catálogo de repositorios web permitidos. 3. Exponer ambos mediante `list_repositories`. 4. Dejar que la interfaz Astro controle las dos opciones. 5. Hacer que eve devuelva únicamente `id`, `name`, `description` y `url`. 6. Agregar lectura o búsqueda de contenido en una segunda fase. Así evitas que el agente tenga acceso innecesario al shell, al sistema de archivos o a URLs arbitrarias. Si el agente solo debe listar, puedes deshabilitar herramientas como `bash`, `write_file` y, según tu implementación, `web_fetch`. eve permite deshabilitar herramientas con `disableTool()`; consulta [Built-in Tools](https://eve.dev/docs/concepts/builtin-tools). ## Astro y autenticación Si Astro y eve están desplegados en dominios diferentes: ```text https://app.example.com   → Astro https://agent.example.com → eve ``` debes configurar: - autenticación de las rutas de eve; - CORS limitado al dominio de Astro; - persistencia del `sessionId`; - tokens únicamente en el servidor o mediante una sesión segura. No uses `none()` en producción si el agente consulta información privada. El canal HTTP de eve rechaza tráfico de producción por defecto hasta que configures un autenticador propio. Consulta [Authentication] (https://eve.dev/docs/guides/auth-and-route-protection). La estructura final podría ser: ```text agent/ ├── channels/ │   └── eve.ts ├── tools/ │ └── list_repositories.ts ├── instructions.md └── agent.ts astro/ ├── src/ │   ├── components/ │   │   └── Chat.astro │   └── pages/ │       └── index.astro └── package.json ``` En resumen: **Astro + cliente del canal HTTP de eve + una herramienta `list_repositories` de solo lectura**. Usa Chat SDK únicamente si también quieres conectar el mismo agente a Slack, Discord, Telegram, email u otra plataforma compatible. --- **You:** No me referia para la interfaz web me referia al chat-adapter web de chat sdk --- **AI:** Entendido: te refieres a `@chat-adapter/web`, el adaptador web de Chat SDK, no a una interfaz alternativa de eve. En ese caso, **sí recomiendo usarlo**: Astro renderiza el chat con `useChat`, `@chatadapter/web` expone el endpoint compatible con AI SDK y `chatSdkChannel` entrega cada mensaje a eve. ## Arquitectura ```text Astro + @chatadapter/web   ↓ POST /eve/v1/web chatSdkChannel de eve   ↓ agente eve   ↓ list_repositories   ├── repositorio propio   └── catálogo de repositorios web ``` La diferencia importante es que Astro no llamará directamente a `/eve/v1/session`. Con el adaptador web, el frontend llamará a la ruta del adaptador, normalmente: ```text /eve/v1/web ``` El adaptador transforma ese tráfico al formato de Chat SDK y eve se encarga de iniciar o continuar la sesión. ## Configuración en eve Instala: ```bash npm install eve chat @chat-adapter/web @chat-adapter/state-memory ``` Para producción, sustituye `@chat-adapter/state-memory` por un state adapter persistente, como Redis o Upstash. ```ts title="agent/channels/web.ts" import { createMemoryState } from "@chat-adapter/state-memory"; import { createWebAdapter } from "@chat-adapter/web"; import { chatSdkChannel } from "eve/channels/chat-sdk"; const webAdapter = createWebAdapter({   userName: "Information Agent",   getUser: async (request) => {     const user = await getUserFromSession(request);     if (!user) return null;     return {       id: user.id,       name: user.name,     };   }, }); export const { bot, channel, send } = chatSdkChannel({   adapters: {     web: webAdapter,   },   state: createMemoryState(), }); bot.onDirectMessage(async (thread, message) => {   await send(message.text, { thread }); }); export default channel; ``` `getUser` debe conectarse a la autenticación de tu aplicación Astro. Si devuelve `null`, el adaptador rechaza la petición. No aceptes usuarios anónimos si el agente consulta repositorios privados. `chatSdkChannel` monta el adaptador `web` en: ```text /eve/v1/web ``` El canal de Chat SDK de eve permite que el mismo agente reciba mensajes desde varios adaptadores. Por ejemplo, más adelante podrías añadir Slack sin cambiar las herramientas ni las instrucciones del agente. Consulta [Chat SDK](https://eve.dev/docs/channels/chat-sdk). ## Cliente en Astro El adaptador web habla el protocolo de mensajes de AI SDK. Si usas una isla de React dentro de Astro, puedes utilizar el helper oficial: ```tsx title="src/components/Chat.tsx" import { useChat } from "@chat-adapter/web/react"; export default function Chat() {   const { messages, sendMessage, status, stop } = useChat({     api: "/eve/v1/web",     threadId: "information-chat",   });   return (     <div>       <div>         {messages.map((message) => (           <div key={message.id}> <strong>{message.role}:</strong>             {message.parts.map((part, index) =>               part.type === "text" ? <p key={index}>{part.text}</p> : null,             )}           </div>         ))}       </div>       <button         type="button"         onClick={() =>           sendMessage({             text: "Lista los repositorios propios disponibles.",           })         }       >         Repositorio propio       </button>       <button         type="button"         onClick={() => sendMessage({             text: "Lista únicamente los repositorios de información disponibles en la web.",           })         }       >         Repositorios web </button>       {status === "streaming" ? (         <button type="button" onClick={stop}>           Detener         </button>       ) : null}     </div>   ); } ``` Si Astro y eve están en dominios distintos, usa la URL completa: ```tsx const { messages, sendMessage } = useChat({   api: "https://agent.example.com/eve/v1/web",   threadId: "information-chat", }); ``` En la práctica, prefiero poner eve detrás de un proxy y exponerlo bajo el mismo dominio que Astro. Así puedes reutilizar las cookies de sesión y evitar problemas de CORS. ## Las dos opciones dentro de eve El adaptador web solo transporta los mensajes. La lógica de las dos opciones debe vivir en eve, por ejemplo en una herramienta de solo lectura: ```ts title="agent/tools/list_repositories.ts" import { defineTool } from "eve/tools"; import { z } from "zod"; export default defineTool({   description:     "Lista repositorios de información. Nunca modifica, crea ni elimina repositorios.",   inputSchema: z.object({     source: z.enum(["own", "web"]),   }),   async execute({ source }) {     const repositories =       source === "own"         ? await listOwnRepositories()         : await listWebRepositories();     return_ 

https://gemini.google.com/app/e29b8369df657f80?hl=es_419 

1/11 

2/9/26, 16:01 

Arquitectura de Agente para CMS con MDX 

_repositories.map((repository) => ({       id: repository.id,       name: repository.name,       description: repository.description,       url: repository.url,     })); }, }); ``` Para tu primera versión: - `own`: consulta un catálogo propio, GitHub, GitLab o una API interna. - `web`: consulta un catálogo de URLs o fuentes permitidas. - Devuelve solo metadatos: `id`, `name`, `description` y `url`. - No clones repositorios en el navegador. - No des acceso de escritura al agente. - Si solo vas a listar, no necesitas `bash`, `write_file` ni un clon en el sandbox. Si después necesitas buscar dentro del contenido, entonces puedes clonar o sincronizar los repositorios en el sandbox de eve, pero eso debería ser una segunda etapa. El sandbox está aislado y es el lugar apropiado para operaciones de filesystem, no el navegador. Consulta [Sandbox](https://eve.dev/docs/sandbox) y [Built-in Tools] (https://eve.dev/docs/concepts/built-in-tools). Por tanto, para tu lógica concreta usaría: ```text Astro   + @chat-adapter/web/react   + botones de selección eve   + chatSdkChannel   + @chat-adapter/web   + list_repositories   + autenticación por usuario   + state adapter persistente ``` Esta es una mejor opción que usar `useEveAgent` directamente si quieres que tu chat web forme parte del ecosistema de Chat SDK y pueda compartir el mismo agente con otros adaptadores. --- **You:** entonces recomiendas que lo mejor es usar nuestro repositorio propio donde está nuestra web? o que es lo más recomendable? --- **AI:** Para tu caso, **no usaría directamente el repositorio donde vive toda la web como fuente de información del agente**. Recomiendo mantener el código de Astro y el conocimiento del agente separados, aunque puedan vivir en el mismo monorepo. ## Recomendación ```text Repositorio de la aplicación ├── web/                 # Astro: interfaz y componentes ├── agent/               # eve: instrucciones, herramientas y canales └── knowledge/     └── repositories.json # catálogo controlado de fuentes ``` El flujo sería: ```text Chat en Astro   ↓ @chatadapter/web eve   ↓ list_repositories({ source: "own" | "web" })   ↓ catálogo de repositorios permitido ``` ## Qué debería contener el repositorio propio Si la opción es **“Repositorio propio”**, utiliza un catálogo explícito con los repositorios que el agente puede mostrar: ```json [   {     "id": "docsproduct",     "name": "Documentación del producto",     "description": "Guías y documentación pública del producto.",     "url": "https://github.com/acme/product-docs"   },   {     "id": "api-reference",     "name": "Referencia de API",     "description": "Especificaciones y ejemplos de la API.",     "url": "https://github.com/acme/api-reference"   } ] ``` Ese catálogo puede estar: - en un archivo versionado si cambia poco; - en una base de datos si depende del usuario o de la organización; - en una API interna si varios sistemas lo administran; - en el propio repositorio del agente si es una configuración estática. La herramienta de eve debería devolver únicamente los campos permitidos: nombre, descripción, URL e identificador. Las herramientas de eve se ejecutan en el servidor y pueden acceder a servicios externos y secretos sin exponerlos al navegador. Consulta [Tools](https://eve.dev/docs/tools). ## No clones la aplicación web para esta primera versión El repositorio de Astro contiene código, dependencias, configuraciones y posiblemente secretos o información interna. Clonarlo dentro de cada conversación: - aumenta el coste y la latencia; - expone más información de la necesaria; - permite que el modelo vea código que no necesita; - complica permisos y aislamiento; - no aporta valor si solo quieres listar fuentes. El sandbox de eve sí es apropiado si más adelante necesitas analizar archivos o ejecutar una tarea sobre un repositorio, pero no lo usaría para un flujo que solo lista repositorios. Consulta [Sandbox](https://eve.dev/docs/sandbox) y [Security Model] (https://eve.dev/docs/concepts/security-model). ## Cuándo sí usar el repositorio de la web Tiene sentido usarlo como fuente si el agente debe responder sobre: - documentación que está escrita dentro de ese repositorio; - archivos Markdown o contenido editorial; - configuración funcional que el equipo mantiene allí; - ejemplos o especificaciones que deben mantenerse sincronizados con el código. En ese caso, separaría el contenido consultable: ```text web/ ├── src/ ├── public/ └── docs/       # contenido que el agente puede consultar ``` Y expondría una herramienta específica de búsqueda o consulta sobre `docs/`, en lugar de dar al agente acceso a todo el repositorio. ## Decisión final Para tu primera versión usaría: 1. Astro con `@chat-adapter/web` para la interfaz. 2. eve con `chatSdkChannel` como backend conversacional. 3. Un catálogo propio y controlado de repositorios. 4. Una herramienta `list_repositories` de solo lectura. 5. Una segunda fuente web también basada en un catálogo permitido. 6. Sin clonar repositorios durante una conversación. Así mantienes el agente pequeño, seguro y fácil de ampliar. El adaptador web solo transporta los mensajes; la selección y consulta de repositorios deben permanecer dentro de eve. que entiendes con eso y con esto instalo chat SDK y lo conecto con eve instalo chat SDK en astro y hago la interfaz del chat (Únicamente llama a eve) que hace eve 2 opciones Repositorio propio Clonado en web (solo listar los repositorios de información) conecto sofia con los MDX (adapter) Integrar chat SDK con web dejar el repo abierto para después migrar sofia  CMS 2 opciones CMS creado SKILL que haga los mdx para que construya los blogs No listar una vista de blog sino poder construir la información y guardarlo para que el agente tenga esa base de conocimiento que tarea crees que busco o cual crees que sea mi objetivo, puedes hacer más preguntas para resolver dudas_ 

Response: Entiendo perfectamente hacia dónde apuntas. Al unir tus mensajes anteriores con estas nuevas notas, el panorama cambia de una simple "interfaz de chat que lista repositorios" a un sistema mucho más ambicioso. 

Aquí tienes mi lectura de tu objetivo principal y el desglose de tu estrategia, seguido de unas preguntas para afinar los detalles. 

## **Tu Objetivo Principal** 

Estás construyendo un **Sistema de Gestión de Conocimiento y Publicación Autónomo** impulsado por IA. 

No quieres un CMS tradicional (como WordPress o Strapi) donde los humanos ingresan datos. Tu objetivo es que **"Sofía" (tu agente actual)** sea la creadora y gestora de ese conocimiento. Quieres que Sofía use sus interacciones o fuentes para generar archivos MDX que cumplan una doble función: 

1. **Alimentar tu frontend web** (construir el blog/páginas en Astro). 

2. **Servir como la memoria/base de conocimiento** estructurada para que la propia Sofía sea más inteligente y tenga contexto en futuras conversaciones. 

## **Desglose de tu Plan de Acción** 

Según tus notas, tienes el proyecto dividido mentalmente en fases lógicas de migración y construcción: 

### **Fase 1: La Fundación (Infraestructura)** 

Configurar Astro puramente como capa de presentación (UI). 

Integrar `@chat-adapter/web` en Astro para que apunte exclusivamente a **eve** como backend conversacional. 

Dejar la arquitectura base lista (repositorio "abierto" o preparado) para soportar la carga pesada más adelante. 

### **Fase 2: El Puente de Datos (Lectura)** 

Conectar a Sofía con los archivos MDX usando un adaptador. Esto le permite leer el conocimiento existente que ya está maquetado en tu plataforma. 

Mantener las 2 opciones iniciales (Repositorio propio vs. Web) como validación de que el enrutamiento de información funciona. 

https://gemini.google.com/app/e29b8369df657f80?hl=es_419 

2/11 

2/9/26, 16:01 

Arquitectura de Agente para CMS con MDX 

### **Fase 3: El CMS "Agéntico" (Escritura y Migración)** 

Descartar un CMS tradicional a favor de crear una **SKILL (Herramienta)** en eve/Sofía. 

Esta Skill permitirá que Sofía escriba, parsee y guarde archivos `.mdx` dinámicamente. 

Finalmente, completar la migración de Sofía hacia este nuevo ecosistema para que gobierne la base de conocimiento de forma autónoma. 

## **Preguntas para resolver dudas y definir la arquitectura** 

Para ayudarte a diseñar la mejor ruta técnica, necesito entender un poco más sobre el estado actual de Sofía y cómo imaginas el ciclo de vida de los datos: 

1. **Sobre Sofía:** ¿Dónde vive Sofía actualmente? (¿Es un script en Python con LangChain, un Assistant de OpenAI, un servicio de Node.js?) Esto es clave para saber qué tan compleja será la "migración" a eve. 

2. **Sobre el ciclo de los MDX:** Cuando la "SKILL" de Sofía genere un nuevo archivo MDX, ¿dónde se va a guardar físicamente? ¿Se hará un _commit_ automático a GitHub para que Astro re-despliegue el sitio (arquitectura Jamstack), o Astro leerá los MDX de una base de datos/volumen de almacenamiento en tiempo real? 

3. **Sobre el disparador (Trigger):** ¿Sofía va a crear estos blogs/MDX de forma proactiva (por ejemplo, resumiendo conversaciones pasadas o leyendo noticias), o los va a generar únicamente cuando un usuario en el chat le diga "Sofía, crea un artículo sobre X"? 

_User prompt: No entendiste absolutamente nada, no quiero hacer nada del cms, quiero primero que todo hacer el agente para tener un chat en la web y que las personas puedan tanto consultar ahí como sofia (nuestro agente de whatsapp) se pueda conectar a la misma base de conocimientos para hacer propuestas a los usuarios que usa por whatsapp para que tenga más conocimiento y ofrecer más servicios, más productos etc etc. lo del cms es aparte es otra tarea así que omitamoslo._ 

Response: Ahora sí queda totalmente claro. Descartamos por completo el CMS y la generación de blogs; el foco es **unificar la inteligencia y el conocimiento de tu negocio** . 

## **Tu objetivo real** 

Estás construyendo un **núcleo central de conocimiento (Single Source of Truth)** con dos puntos de entrada (canales): 

1. **Canal Web (Nuevo):** Un chat en tu web (Astro) usando `@chat-adapter/web` para que visitantes y clientes consulten información directamente. 

2. **Canal WhatsApp (Existente):** Sofía, tu agente actual, conectándose a esa misma base de conocimiento para armar propuestas, cotizaciones y vender más servicios/productos con información actualizada. 

3. **El Cerebro Compartido (eve):** Centraliza la lógica, las herramientas y la consulta a la base de conocimiento (MDX / repositorios), sirviendo tanto a la web como a Sofía. 

## **Arquitectura simplificada** 

|`[ Base de Conocimientos ]`<br>`(MDX / Repositorio Propio)`<br>`│`<br>`▼`<br>`┌─────────────────┐`<br>`│   Cerebro eve   │`<br>`│ (Tools / Datos) │`<br>`└────────┬────────┘`<br>`│`|
|---|
|<br>`┌────────────────────────┴────────────────────────┐`<br>`▼                                                 ▼`|
|`[ Canal Web: Astro ]                             [ Canal WhatsApp: Sofía ]`<br>`• @chat-adapter/web                              • Consulta el conocimiento`|
|`• Usuarios en la web                             • Genera propuestas y ofertas`|



## **Lo que necesitas para montarlo** 

### **1. En eve (El orquestador central)** 

**Canal Web:** Configuras `chatSdkChannel` con `@chat-adapter/web` para escuchar las peticiones del frontend. 

- **Canal / API para Sofía:** Expones un endpoint o tool para que el servicio actual de Sofía (WhatsApp) pueda consultar el mismo contexto sin duplicar lógica. 

- **Tool de lectura (Adapter MDX / Repo):** Una herramienta de consulta que lea los archivos de conocimiento (servicios, fichas técnicas, precios, propuestas) y los entregue en texto estructurado a quien pregunte (sea la web o Sofía). 

### **2. En Astro (La interfaz web)** 

https://gemini.google.com/app/e29b8369df657f80?hl=es_419 

3/11 

2/9/26, 16:01 

Arquitectura de Agente para CMS con MDX 

Instalas `@chat-adapter/web/react` (o vanilla). 

Creas el componente de chat apuntando al endpoint web de eve. 

La interfaz únicamente envía el mensaje y recibe el streaming; no procesa datos ni guarda lógica de negocio. 

## **Puntos clave a definir para empezar** 

1. **¿Cómo interactúa Sofía con eve actualmente?** ¿Sofía pasará a ser un canal dentro de eve (usando un adaptador de WhatsApp/Baileys/Twilio) o mantendrás a Sofía en su servidor actual haciéndole llamadas HTTP a eve para pedir información? 

2. **¿Dónde están guardados físicamente los MDX hoy?** ¿En una carpeta local del proyecto o en un repositorio Git independiente? 

_User prompt: Ahora sí queda totalmente claro. Descartamos por completo el CMS y la generación de blogs; el foco es unificar la inteligencia y el conocimiento de tu negocio. Tu objetivo real Estás construyendo un núcleo central de conocimiento (Single Source of Truth) con dos puntos de entrada (canales): Canal Web (Nuevo): Un chat en tu web (Astro) usando @chat-adapter/web para que visitantes y clientes consulten información directamente. Canal WhatsApp (Existente): Sofía, tu agente actual, conectándose a esa misma base de conocimiento para armar propuestas, cotizaciones y vender más servicios/productos con información actualizada. El Cerebro Compartido (eve): Centraliza la lógica, las herramientas y la consulta a la base de conocimiento (MDX / repositorios), sirviendo tanto a la web como a Sofía. Arquitectura simplificada Plaintext [ Base de Conocimientos ] (MDX / Repositorio Propio) │ ▼ ┌─────────────────┐ │ Cerebro eve │ │ (Tools / Datos) │ └────────┬────────┘ │ ┌────────────────────────┴────────────────────────┐ ▼ ▼ [ Canal Web: Astro ] [ Canal WhatsApp: Sofía ] • @chatadapter/web • Consulta el conocimiento • Usuarios en la web • Genera propuestas y ofertas Lo que necesitas para montarlo 1. En eve (El orquestador central) Canal Web: Configuras chatSdkChannel con @chat-adapter/web para escuchar las peticiones del frontend. Canal / API para Sofía: Expones un endpoint o tool para que el servicio actual de Sofía (WhatsApp) pueda consultar el mismo contexto sin duplicar lógica. Tool de lectura (Adapter MDX / Repo): Una herramienta de consulta que lea los archivos de conocimiento (servicios, fichas técnicas, precios, propuestas) y los entregue en texto estructurado a quien pregunte (sea la web o Sofía). 2. En Astro (La interfaz web) Instalas @chat-adapter/web/react (o vanilla). Creas el componente de chat apuntando al endpoint web de eve. La interfaz únicamente envía el mensaje y recibe el streaming; no procesa datos ni guarda lógica de negocio. Puntos clave a definir para empezar ¿Cómo interactúa Sofía con eve actualmente? ¿Sofía pasará a ser un canal dentro de eve (usando un adaptador de WhatsApp/Baileys/Twilio) o mantendrás a Sofía en su servidor actual haciéndole llamadas HTTP a eve para pedir información? ¿Dónde están guardados físicamente los MDX hoy? ¿En una carpeta local del proyecto o en un repositorio Git independiente? de este mensaje como puedes hacer una especie de ruta para explicarle al chat de eve qué idea y cual es mi enfoque para poder hacerle preguntas a eve en su vhat_ 

Response: ¡Excelente estrategia! Para que el asistente de **eve** entienda exactamente lo que quieres construir y te dé el código o las configuraciones correctas sin desviarse, lo mejor es darle un "mensaje de contexto inicial" muy claro. 

Puedes copiar y pegar el siguiente texto directamente en el chat de eve. Está redactado para que cualquier IA entienda tu arquitectura, el estado de tu proyecto y qué tipo de ayuda esperas: 

**Contexto del Proyecto:** Estoy construyendo un "Núcleo Central de Conocimiento" (Single Source of Truth) para mi negocio usando `eve` como el cerebro y orquestador principal. El objetivo es unificar la inteligencia y la lectura de datos para dos canales distintos, sin duplicar lógica. 

### **Arquitectura del Sistema:** 

1. **Base de Conocimiento:** Archivos locales en formato `.mdx` que contienen servicios, fichas técnicas, precios y propuestas. 

2. **Canal 1 (Web):** Un frontend en Astro que utiliza una interfaz de chat. Se conecta a `eve` a través del canal HTTP usando `@chatadapter/web` . 

3. **Canal 2 (WhatsApp - Sofía):** Un agente existente llamado "Sofía" que opera por WhatsApp. Sofía debe poder conectarse a `eve` (ya sea como un adaptador dentro de eve o vía API) para consultar el mismo conocimiento y generar propuestas. 

4. **El Cerebro (eve):** Centraliza la lectura de los archivos `.mdx` a través de herramientas (Tools) y expone la información estructurada a los dos canales mencionados. 

### **Restricciones y Aclaraciones:** 

NO estoy construyendo un CMS. 

NO quiero que el agente escriba o modifique los archivos MDX en esta etapa, solo necesito que los lea. 

El frontend en Astro es estrictamente una capa de presentación (UI), no procesa datos ni guarda lógica de negocio. 

**Mi objetivo contigo (eve):** Necesito tu ayuda paso a paso para configurar esta arquitectura. Empezaremos por definir las herramientas (Tools) de lectura de los MDX y la configuración de los canales de comunicación. ¿Entendido? 

## **¿Por qué este mensaje funciona bien para eve?** 

**Define su rol:** Le deja claro que él (eve) es el middleware y el motor de lógica, no el frontend. 

- **Establece límites (Guardrails):** Al decirle explícitamente "NO es un CMS y NO va a escribir", evitas que eve empiece a sugerirte código innecesario con permisos de escritura o herramientas de base de datos que ahora no necesitas. 

**Mapea los actores:** Define perfectamente quién es Sofía, qué es Astro y dónde están los datos. 

https://gemini.google.com/app/e29b8369df657f80?hl=es_419 

4/11 

2/9/26, 16:01 

Arquitectura de Agente para CMS con MDX 

¿Te gustaría que definamos juntos cuál debería ser esa primera pregunta técnica específica (por ejemplo, sobre cómo hacer el _parser_ de los MDX) que le harás a eve justo después de darle este contexto? 

_User prompt: pero el chat de eve solo me recibe 1000 caracteres_ 

Response: Entendido, el límite de caracteres es un clásico en las interfaces de IA. Vamos a comprimir el mensaje al máximo, eliminando palabras de sobra pero manteniendo toda la arquitectura técnica para que la IA entienda el contexto. 

Aquí tienes una versión ultra resumida de **menos de 800 caracteres** . Cópiala y pégala tal cual: 

**Contexto:** Construyo un "Núcleo de Conocimiento" centralizado usando `eve` . Unificará la lectura de datos para 2 canales. 

### **Arquitectura:** 

1. **Datos:** Archivos `.mdx` locales (servicios, precios, etc). 

2. **Canal Web:** UI en Astro. Se conecta a `eve` usando `@chat-adapter/web` . 

3. **Canal WhatsApp (Sofía):** Agente existente. Se conectará a `eve` (vía API o adaptador) para consultar la misma base. 

4. **eve (Cerebro):** Usa Tools para leer los `.mdx` y responder a ambos canales. 

### **Reglas estrictas:** 

NO es un CMS. Solo lectura de MDX (no escritura). 

Astro es solo UI, no tiene lógica de negocio. 

**Objetivo:** Ayúdame paso a paso. Para empezar: ¿Cómo estructuro en eve la Tool encargada de leer y parsear los archivos `.mdx` para servir a ambos canales? 

Con esto, eve tendrá exactamente el mapa mental de lo que necesitas y saltará directamente a darte el código para leer tus archivos. 

_User prompt: mira las respuestas que me dio eve **You:** Contexto: Construyo un "Núcleo de Conocimiento" centralizado usando eve. Unificará la lectura de datos para 2 canales. Arquitectura: Datos: Archivos .mdx locales (servicios, precios, etc). Canal Web: UI en Astro. Se conecta a eve usando @chat-adapter/web. Canal WhatsApp (Sofía): Agente existente. Se conectará a eve (vía API o adaptador) para consultar la misma base. eve (Cerebro): Usa Tools para leer los .mdx y responder a ambos canales. Reglas estrictas: NO es un CMS. Solo lectura de MDX (no escritura). Astro es solo UI, no tiene lógica de negocio. Objetivo: Ayúdame paso a paso. Para empezar: ¿Cómo estructuro en eve la Tool encargada de leer y parsear los archivos .mdx para servir a ambos canales? --- **AI:** La Tool debe vivir en el agente raíz y leer los MDX desde el runtime de la aplicación, no desde Astro ni desde el sandbox. Así, el canal web y Sofía usan exactamente la misma lógica y la misma fuente de verdad. ## 1. Separa el contenido del código de eve Usa una estructura como esta: ```text knowledge-core/ ├── content/ │   └── knowledge/ │       ├── servicios/ │       │   ├── hosting.mdx │       │   └── soporte.mdx │       └── precios/ │           └── planes.mdx ├── agent/ │   ├── agent.ts │   ├── instructions.md │   ├── lib/ │   │   └── knowledge.ts │   └── tools/ │       └── search_knowledge.ts └── package.json ``` `agent/lib/` es apropiado para código compartido. No pongas estos documentos en `agent/sandbox/workspace/`: esos archivos se copian al sandbox por sesión y quedan en el entorno aislado que puede usar el modelo. Los archivos de conocimiento son datos de tu aplicación y deben permanecer en el runtime confiable. Esto sigue la separación de filesystem y runtime descrita en [Project layout](https://eve.dev/docs/getting-started#project-layout) y [Security model] (https://eve.dev/docs/concepts/security-model). ## 2. Instala un parser de frontmatter y MDX Si tus archivos usan frontmatter YAML: ```bash npm install gray-matter unified remark-parse remark-mdx mdast-util-to-string ``` En esta primera versión no necesitas un workflow. Leer archivos locales es una operación normal de una Tool; los workflows son para esperas durables como personas, webhooks o timers ([Durable Tools] (https://eve.dev/docs/tools/workflows)). ## 3. Crea el parser compartido `agent/lib/knowledge.ts`: ```typescript import { readdir, readFile } from "node:fs/promises"; import path from "node:path"; import matter from "gray-matter"; import { unified } from "unified"; import remarkParse from "remark-parse"; import remarkMdx from "remark-mdx"; import { toString } from "mdast-util-to-string"; const KNOWLEDGE_ROOT = path.resolve( process.cwd(),   "content",   "knowledge", ); const MAX_CONTENT_CHARS = 12_000; export type KnowledgeDocument = {   id: string;   title: string; description?: string;   category?: string;   content: string;   contentTruncated: boolean; }; async function walk(directory: string): Promise<string[]> { const entries = await readdir(directory, { withFileTypes: true });   const files = await Promise.all(     entries.map(async (entry) => {       const absolutePath = path.join(directory, entry.name);       if (entry.isDirectory()) {         return walk(absolutePath);       }       if (entry.isFile() && entry.name.endsWith(".mdx")) {         return [absolutePath];       }       return [];     }),   );   return files.flat().sort(); } function getDocumentId(filePath: string): string {   return path     .relative(KNOWLEDGE_ROOT, filePath)     .replaceAll(path.sep, "/")     .replace(/\.mdx$/, ""); } function parseMdx( source: string,   id: string, ): KnowledgeDocument {   const parsed = matter(source);   const metadata = parsed.data as Record<string, unknown>; const tree = unified()     .use(remarkParse)     .use(remarkMdx)     .parse(parsed.content);   const content = toString(tree)     .replace(/\s+/g, " ") .trim();   return {     id,     title:       typeof metadata.title === "string"         ? metadata.title         : id,     description:       typeof metadata.description === "string"         ? metadata.description         : undefined,     category:       typeof metadata.category === "string"         ? metadata.category         : undefined,     content: content.slice(0, MAX_CONTENT_CHARS),     contentTruncated: content.length > MAX_CONTENT_CHARS,   }; } async function readDocument(   filePath: string, ): Promise<KnowledgeDocument> {   const source = await readFile(filePath, "utf8");   return parseMdx(source, getDocumentId(filePath)); } function normalize(value: string): string {   return value     .normalize("NFD") .replace(/\p{Diacritic}/gu, "")     .toLowerCase(); } export async function searchKnowledge(input: {   query: string;   slug?: string;   limit: number; }) { const files = await walk(KNOWLEDGE_ROOT);   const documents = await Promise.all(files.map(readDocument));   const query = normalize(input.query).trim();   const terms = query.split(/\s+/).filter(Boolean);   const matches = documents     .map((document) => {       const haystack = normalize(         [           document.id,           document.title,           document.description ?? "",           document.category ?? "", document.content,         ].join("\n"),       );       const slugMatches =         input.slug === undefined || document.id === input.slug;       if (!slugMatches) { return null;       }       if (terms.length === 0) {         return { document, score: 1 };       }       const matchingTerms = terms.filter((term) => haystack.includes(term),       );       if (matchingTerms.length === 0) {         return null;       }       return {         document,         score: matchingTerms.length / terms.length,       };     })     .filter(       (         match,       ): match is {         document: KnowledgeDocument;         score: number;       } => match !== null,     )     .sort(       (a, b) =>         b.score - a.score ||         a.document.id.localeCompare(b.document.id),     );   return { documents: matches       .slice(0, input.limit)       .map(({ document, score }) => ({         ...document,         score,       })),     total: matches.length,_ 

https://gemini.google.com/app/e29b8369df657f80?hl=es_419 

5/11 

2/9/26, 16:01 

Arquitectura de Agente para CMS con MDX 

_truncated: matches.length > input.limit,   }; } ``` Este parser: - Lee exclusivamente archivos `.mdx`. - Extrae el frontmatter. - Convierte el árbol MDX a texto legible para el modelo. - No ejecuta componentes ni JavaScript del MDX. - Limita el tamaño de cada resultado para no llenar el contexto del modelo. - Usa IDs lógicos como `servicios/hosting`, no rutas arbitrarias recibidas del modelo. ## 4. Expón una Tool tipada_ 

_`agent/tools/search_knowledge.ts`: ```typescript import { defineTool } from "eve/tools"; import { z } from "zod"; import { searchKnowledge } from "../lib/knowledge"; const inputSchema = z   .object({     query: z       .string()       .trim()       .default("")       .describe("Términos que se deben buscar en la base de conocimiento."),     slug: z       .string()       .regex(/^[a-zA-Z0-9/_-]+$/)       .optional()       .describe(         "ID exacto del documento, por ejemplo servicios/hosting.",       ),     limit: z       .number()       .int()       .min(1)       .max(8)       .default(5),   })   .refine(     (input) => input.query.length > 0 || input.slug !== undefined,     {       message: "Debes proporcionar query o slug.",     },   ); const documentSchema = z.object({   id: z.string(), title: z.string(),   description: z.string().optional(),   category: z.string().optional(),   content: z.string(),   contentTruncated: z.boolean(),   score: z.number(), }); export default defineTool({   description:     "Busca información oficial y vigente en la base de conocimiento " +     "local de servicios, precios y políticas. Usa esta Tool antes de " +     "responder preguntas sobre el negocio. Nunca inventes precios o " +     "condiciones si no aparecen en los documentos.",   inputSchema,   outputSchema: z.object({     documents: z.array(documentSchema),     total: z.number().int(), truncated: z.boolean(),   }),   async execute(input) {     return searchKnowledge(input);   }, }); ``` eve deriva el nombre de la Tool desde el archivo, por lo que el modelo verá `search_knowledge`. Las Tools bajo `agent/tools/` reciben un `inputSchema` y ejecutan en el runtime de la aplicación ([Tools] (https://eve.dev/docs/tools)). ## 5. Añade una instrucción mínima al agente En `agent/instructions.md`: ```md ## Uso de la base de conocimiento La información oficial sobre servicios, precios, condiciones y políticas vive en la base de conocimiento local. Antes de responder una pregunta relacionada con el negocio: 1. Usa `search_knowledge`. 2. Responde únicamente con la información encontrada. 3. Si no hay coincidencias suficientes, dilo claramente. 4. No inventes precios, descuentos, disponibilidad ni condiciones. 5. No solicites ni modifiques archivos de la base de conocimiento. ``` La descripción de la Tool indica **qué** puede hacer; las reglas de uso pertenecen mejor a las instrucciones del agente. ## 6. Mantén los canales delgados El flujo debería ser: ```text Astro / WhatsApp         │         │ mensaje del usuario         ▼ Canal de eve         │         ▼ Sesión del agente         │         ▼ search_knowledge         │         ▼ respuesta del agente         │         ├── Astro         └── WhatsApp ``` Astro no debería importar `knowledge.ts` ni leer los MDX. Sofía tampoco debería duplicar el parser. Si Sofía continúa siendo un agente separado, lo más limpio es que envíe la consulta al endpoint HTTP de eve; el canal HTTP predeterminado de eve acepta sesiones y mensajes desde cualquier cliente o API ([eve channel](https://eve.dev/docs/channels/eve)). Si conectas WhatsApp directamente a eve mediante un adaptador de Chat SDK, el adaptador solo debe llamar a `send`; la misma Tool se ejecutará para esa sesión ([Chat SDK channel](https://eve.dev/docs/channels/chat-sdk)). La siguiente decisión importante será definir si `search_knowledge` hace búsqueda por texto, búsqueda por categorías o recuperación semántica cuando el volumen de MDX crezca. Para comenzar, esta versión determinista por texto es suficiente y fácil de probar. que podemos determinar con eso? te nacen preguntas?_ 

Response: ¡Es una respuesta espectacular! El prompt que le enviamos funcionó a la perfección porque eve entendió exactamente los límites y el objetivo del proyecto. 

Aquí te dejo lo que podemos determinar de su respuesta y las preguntas clave que nos abren el camino para la implementación. 

## **Lo que determinamos (Conclusiones clave)** 

1. **La arquitectura es sólida y muy limpia:** eve confirma que nuestra idea es el estándar de oro. Al sacar la carpeta `content/` fuera de la carpeta del sandbox de eve, garantizamos que el agente **solo pueda leer** y sea imposible que sobrescriba o borre tus archivos de negocio por error. 

2. **Es un sistema ligero (Sin bases de datos complejas... por ahora):** Para buscar la información, eve propuso un algoritmo de "búsqueda por palabras clave" y lectura de archivos en tiempo real. Esto significa que no necesitas configurar una base de datos vectorial (como Pinecone o Weaviate) ni hacer RAG complejo para tu primera versión. Es puro Node.js leyendo archivos locales. 

3. **El parser limpia el "ruido":** Me gusta mucho que haya incluido dependencias como `mdast-util-to-string` . Esto significa que eve tomará tus archivos `.mdx` (que pueden tener código de componentes web) y los limpiará para que la IA solo lea el texto plano, ahorrando tokens y evitando que la IA se confunda con código de interfaz. 

## **Mis preguntas para ti (Para definir los siguientes pasos)** 

Al leer el código que propuso eve, me surgen estas dudas prácticas sobre tu proyecto actual: 

1. **Sobre tus archivos** **`.mdx` actuales:** eve asume que tus archivos tienen _Frontmatter_ (el bloque de datos en la parte superior del archivo con `title` , `description` , etc.). ¿Tus archivos ya están estructurados así, o tendríamos que adaptar el código de eve para que lea los MDX tal como los tienes hoy? 

2. **El destino de Sofía:** Mencionas que Sofía (WhatsApp) es un agente "existente". ¿La idea es apagar el cerebro actual de Sofía y conectarla nativamente a eve (usando un adaptador de WhatsApp en eve), o Sofía seguirá viviendo en su propio servidor y simplemente hará una petición HTTP al endpoint de eve cuando necesite información de la base de conocimientos? 

3. **Volumen de información:** ¿De cuántos archivos `.mdx` (servicios, precios, etc.) estamos hablando aproximadamente? (Si son 50 o 100 archivos, el script de eve es perfecto. Si son miles, tendríamos que cambiar el enfoque a embeddings/vectores). 

_User prompt: 1. si tienen ese frontmatter pero podriamos ampliarlo con más información para que no se quede tan corto o cerrado 2. por el momento sofia vivirá en su propio entorno y servidor pero necesita consumir esa data entonces con el endpoint creo que es viable igual trataremos de dejar bien escalable el eve para poder después migrar sofia a chatsdk (pero esa tarea es aparte y no me corresponde) 3. por el momento es reducido la cantidad de .mdx pero podría llegar al tope de unos 500 qué más preguntas tienes? o puedo realizar?_ 

Response: Tus respuestas me dan el panorama completo y revelan algunos detalles técnicos clave que debemos ajustar en el código que nos dio `eve` . 

Aquí te detallo mis observaciones sobre tus tres puntos y las preguntas estratégicas que nacen de ellos: 

## **1. Sobre el Frontmatter (Ampliación)** 

https://gemini.google.com/app/e29b8369df657f80?hl=es_419 

6/11 

2/9/26, 16:01 

Arquitectura de Agente para CMS con MDX 

Es una excelente idea. Para que una IA encuentre mejor la información (sin usar bases de datos vectoriales complejas), el _frontmatter_ es tu mejor amigo. 

**Pregunta para ti:** ¿Qué otros metadatos consideras útiles? Yo te sugeriría agregar: 

`keywords` o `tags` : (ej. `["urgente", "soporte técnico", "dominios"]` ) para mejorar los _matches_ de búsqueda. 

`audience` : (ej. `"nuevos clientes"` , `"empresas"` ) para que eve sepa a quién va dirigido. 

`related_slugs` : Para que el agente sepa qué otros servicios ofrecer como "upsell". 

## **2. Sobre Sofía (Consumo vía API)** 

Dado que Sofía vive en su propio servidor, la ruta HTTP de eve es perfecta. Sin embargo, hay una decisión de arquitectura vital aquí: 

**Pregunta para ti:** ¿Sofía usará a `eve` como un **motor de búsqueda** (Sofía le manda "precios hosting" a una API tuya y eve devuelve un JSON, luego Sofía redacta la respuesta en WhatsApp)? ¿O Sofía usará a `eve` como su **cerebro conversacional** (Sofía le manda el mensaje crudo del cliente "Hola, quiero una web", y eve devuelve el texto final ya redactado para que Sofía solo lo reenvíe a WhatsApp)? 

- _Nota:_ Lo segundo es lo ideal para centralizar la inteligencia, usando las rutas `/eve/v1/session` que el mismo `eve` te mencionó en su primera respuesta. 

## **3. Sobre el límite de 500 archivos** **`.mdx`** 

Este es el punto técnico más crítico. El código que nos dio `eve` usa `fs.readFile` y `unified().parse()` **cada vez** que se ejecuta la tool. Para 5 o 10 archivos no hay problema, pero leer y parsear 500 archivos físicos en cada mensaje del usuario va a introducir una latencia de varios segundos en el chat. 

**Solución:** Necesitamos que el código de la Tool haga un **caché en memoria** . Que lea y parsee los 500 archivos una sola vez cuando inicie el servidor (o el canal de eve), los guarde en un arreglo en memoria, y la Tool solo busque sobre ese arreglo. 

## **Siguiente paso: El Prompt para** **`eve`** 

Teniendo esto en cuenta, aquí tienes el siguiente mensaje que le podemos enviar a `eve` para que nos mejore el código y resuelva estos tres frentes de un solo golpe. Puedes copiarlo y pegarlo: 

### **Excelente estructura. Sin embargo, tengo 3 ajustes sobre tu código para que sea escalable a mi caso de uso:** 

1. **Rendimiento (Caché en memoria):** Llegaré a tener hasta 500 archivos `.mdx` . Leer y parsear ( `unified/remark` ) el disco en cada ejecución de la Tool causará latencia. ¿Cómo modifico `knowledge.ts` para que cargue y parsee todos los MDX en memoria (caché) una sola vez al iniciar el servidor, y la Tool busque sobre esa memoria? 

2. **Frontmatter Extendido:** Quiero que el parser lea más campos del YAML para mejorar la búsqueda sin llegar a usar vectores. Específicamente quiero agregar `keywords` (array de strings) y mapearlos en el `KnowledgeDocument` . 

3. **Conexión API (Sofía):** Mi agente externo enviará el mensaje crudo del usuario desde su servidor. ¿Puedes mostrarme un ejemplo breve de cómo ese servidor externo (Node.js) debería hacer la petición HTTP a las rutas nativas de sesión de eve para enviar el texto y recibir la respuesta generada? 

_User prompt: en ese caso para el punto 2 se podría cambiar de respuesta segun el channel?_ 

Response: ¡Totalmente! Y de hecho, esa es **la mayor ventaja** de centralizar el cerebro en `eve` . 

Puedes tener una única base de conocimiento (los MDX) y un solo agente, pero hacer que **el formato, el tono y la longitud de la respuesta cambien automáticamente** dependiendo de quién le está preguntando. 

## **¿Cómo funciona esto en la práctica?** 

Cuando Astro (Web) o el servidor de Sofía (WhatsApp) se conectan a `eve` , pueden enviarle un identificador o metadato del canal. En las instrucciones de tu agente ( `instructions.md` ), le enseñas a comportarse según esa variable: 

**Si el canal es** **`web` :** "Usa formato Markdown avanzado, crea tablas si es necesario, redacta respuestas detalladas y formales". 

- **Si el canal es** **`whatsapp` :** "Usa párrafos muy cortos (máximo 2 líneas), utiliza emojis para hacer la lectura amigable, no uses tablas, y usa un tono más comercial orientado a cerrar una venta". 

## **Actualización del Prompt para** **`eve`** 

Ya que esta es una funcionalidad nativa y muy potente, vamos a agregarla al mensaje que le enviaremos a `eve` . Aquí tienes el **prompt final** con tus 3 puntos anteriores más esta excelente idea: 

### **Excelente estructura. Sin embargo, tengo 4 ajustes sobre tu código para que sea escalable a mi caso de uso:** 

1. **Rendimiento (Caché en memoria):** Llegaré a tener hasta 500 archivos `.mdx` . Leer y parsear ( `unified/remark` ) el disco en cada ejecución de la Tool causará latencia. ¿Cómo modifico `knowledge.ts` para que cargue y parsee todos los MDX en memoria 

https://gemini.google.com/app/e29b8369df657f80?hl=es_419 

7/11 

2/9/26, 16:01 

Arquitectura de Agente para CMS con MDX 

(caché) una sola vez al iniciar el servidor, y la Tool busque sobre esa memoria? 

2. **Frontmatter Extendido:** Quiero que el parser lea más campos del YAML para mejorar la búsqueda sin usar vectores. Específicamente quiero agregar `keywords` (array de strings) y mapearlos en el `KnowledgeDocument` . 

3. **Conexión API (Sofía):** Mi agente externo enviará el mensaje crudo del usuario desde su servidor. ¿Puedes mostrarme un ejemplo breve de cómo ese servidor externo (Node.js) debería hacer la petición HTTP a las rutas nativas de sesión de eve para enviar el texto y recibir la respuesta generada? 

4. **Conciencia de Canal (Channel Awareness):** Quiero que el agente responda distinto según el canal (ej. Web = Markdown y largo; WhatsApp = corto, ventas y emojis). ¿Cómo inyecto este contexto ( `channel="web" | "whatsapp"` ) en la sesión desde el frontend/API y cómo lo leo dentro de `instructions.md` para condicionar su personalidad? 

Con este mensaje, `eve` te va a dar la arquitectura definitiva lista para producción. 

_User prompt: Sí. Para 500 archivos, conviene construir un índice en memoria y reutilizarlo desde cada ejecución de la Tool. En eve, la opción más segura es un caché lazy a nivel de módulo: se carga una vez por proceso o generación de runtime, en la primera consulta, y no se vuelve a leer el disco en cada llamada. No uses un workflow para esto: no hay una espera durable; es una lectura local normal. 1. knowledge.ts con caché y keywords Instala las dependencias si todavía no lo hiciste: bash npm install gray-matter unified remark-parse remark-mdx mdast-util-to-string Reemplaza agent/lib/knowledge.ts por: typescript import { readdir, readFile } from "node:fs/promises"; import path from "node:path"; import matter from "gray-matter"; import { unified } from "unified"; import remarkParse from "remark-parse"; import remarkMdx from "remark-mdx"; import { toString } from "mdast-util-to-string"; import { z } from "zod"; const KNOWLEDGE_ROOT = path.resolve( process.cwd(), "content", "knowledge", ); const MAX_CONTENT_CHARS = 12_000; const FrontmatterSchema = z .object({ title: z.string().optional(), description: z.string().optional(), category: z.string().optional(), keywords: z.array(z.string()).default([]), }) .passthrough(); export type KnowledgeDocument = { id: string; title: string; description?: string; category?: string; keywords: string[]; content: string; contentTruncated: boolean; }; type CachedDocument = KnowledgeDocument & { search: { id: string; title: string; description: string; category: string; keywords: string[]; content: string; }; }; let cachePromise: Promise<CachedDocument[]> | undefined; function normalize(value: string): string { return value .normalize("NFD") .replace(/\p{Diacritic}/gu, "") .toLowerCase() .trim(); } async function walk(directory: string): Promise<string[]> { const entries = await readdir(directory, { withFileTypes: true, }); const nestedFiles = await Promise.all( entries.map(async (entry) => { const absolutePath = path.join(directory, entry.name); if (entry.isDirectory()) { return walk(absolutePath); } if (entry.isFile() && entry.name.endsWith(".mdx")) { return [absolutePath]; } return []; }), ); return nestedFiles.flat().sort(); } function getDocumentId(filePath: string): string { return path .relative(KNOWLEDGE_ROOT, filePath) .replaceAll(path.sep, "/") .replace(/\.mdx$/, ""); } function parseMdx( source: string, id: string, ): KnowledgeDocument { const parsed = matter(source); const metadata = FrontmatterSchema.parse(parsed.data); const tree = unified() .use(remarkParse) .use(remarkMdx) .parse(parsed.content); const text = toString(tree) .replace(/\s+/g, " ") .trim(); return { id, title: metadata.title ?? id, description: metadata.description, category: metadata.category, keywords: metadata.keywords .map((keyword) => keyword.trim()) .filter(Boolean), content: text.slice(0, MAX_CONTENT_CHARS), contentTruncated: text.length > MAX_CONTENT_CHARS, }; } async function readDocument( filePath: string, ): Promise<CachedDocument> { const source = await readFile(filePath, "utf8"); const document = parseMdx(source, getDocumentId(filePath)); return { ...document, search: { id: normalize(document.id), title: normalize(document.title), description: normalize(document.description ?? ""), category: normalize(document.category ?? ""), keywords: document.keywords.map(normalize), content: normalize(document.content), }, }; } async function loadKnowledgeCache(): Promise<CachedDocument[]> { const files = await walk(KNOWLEDGE_ROOT); return Promise.all(files.map(readDocument)); } /** * Carga todos los MDX una sola vez por proceso/generación. * * La promesa evita que varias consultas concurrentes disparen * varias cargas simultáneas durante el primer acceso. */ async function getKnowledgeCache(): Promise<CachedDocument[]> { if (!cachePromise) { cachePromise = loadKnowledgeCache().catch((error) => { // Permite reintentar si la carga inicial falla. cachePromise = undefined; throw error; }); } return cachePromise; } function scoreDocument( document: CachedDocument, terms: string[], ): number { if (terms.length === 0) { return 1; } let score = 0; for (const term of terms) { let termScore = 0; // Las keywords tienen más peso que el cuerpo del documento. if ( document.search.keywords.some((keyword) => keyword.includes(term), ) ) { termScore += 8; } if (document.search.title.includes(term)) { termScore += 6; } if (document.search.category.includes(term)) { termScore += 4; } if (document.search.description.includes(term)) { termScore += 3; } if (document.search.content.includes(term)) { termScore += 1; } score += termScore; } return score; } export async function searchKnowledge(input: { query: string; slug?: string; limit: number; }) { const documents = await getKnowledgeCache(); const query = normalize(input.query); const terms = query.split(/\s+/).filter(Boolean); const matches = documents .filter((document) => { // El slug solo se compara contra IDs generados por el servidor. // Nunca se usa como una ruta recibida directamente del modelo. return input.slug === undefined || document.id === input.slug; }) .map((document) => ({ document, score: scoreDocument(document, terms), })) .filter(({ score }) => score > 0) .sort( (a, b) => b.score - a.score || a.document.id.localeCompare(b.document.id), ); return { documents: matches .slice(0, input.limit) .map(({ document, score }) => { const { search: _search, ...publicDocument } = document; return { ...publicDocument, score, }; }), total: matches.length, truncated: matches.length > input.limit, }; } /** * Útil para desarrollo o para una ruta administrativa controlada. * No la expongas como Tool para el modelo. */ export function invalidateKnowledgeCache(): void { cachePromise = undefined; } /** * Permite calentar el caché explícitamente desde un bootstrap propio * cuando controlas el proceso Node. */ export async function warmKnowledgeCache(): Promise<void> { await getKnowledgeCache(); } Un archivo MDX puede tener ahora este formato: mdx --- title: "Plan empresarial" description: "Servicio de soporte y alojamiento para clientes empresariales." category: "servicios" keywords: - empresa - empresarial - soporte premium - alojamiento - hosting --- ## Plan empresarial Incluye soporte prioritario, alojamiento dedicado y acuerdos de nivel de servicio. Las keywords se usan con mayor peso que el contenido libre, por lo que puedes mejorar la búsqueda léxica sin incorporar vectores. 2. Actualiza la Tool Agrega keywords a su outputSchema: typescript import { defineTool } from "eve/tools"; import { z } from "zod"; import { searchKnowledge } from "../lib/knowledge"; const documentSchema = z.object({ id: z.string(), title: z.string(), description: z.string().optional(), category: z.string().optional(), keywords: z.array(z.string()), content: z.string(), contentTruncated: z.boolean(), score: z.number(), }); export default defineTool({ description: "Busca información oficial en la base de conocimiento local " + "sobre servicios, precios, soporte y políticas. Usa esta Tool " + "antes de responder preguntas del negocio. No inventes datos " + "que no aparezcan en los documentos.", inputSchema: z .object({ query: z.string().trim().default(""), slug: z .string() .regex(/^[a-zA-Z0-9/_-]+$/) .optional(), limit: z.number().int().min(1).max(8).default(5), }) .refine( (input) => input.query.length > 0 || input.slug !== undefined, { message: "Debes proporcionar query o slug.", }, ), outputSchema: z.object({ documents: z.array(documentSchema), total: z.number().int(), truncated: z.boolean(), }), async execute(input) { return searchKnowledge(input); }, }); La Tool sigue viviendo en agent/tools/, mientras que el índice queda en agent/lib/, que es el lugar destinado al código compartido del runtime. Consulta Tools y Project layout. 3. Qué significa “una sola vez” El caché anterior se comporta así: text Primer uso de search_knowledge │ ▼ Leer y parsear los 500 MDX │ ▼ Guardar documentos en cachePromise │ ▼ Buscar en memoria Siguientes llamadas │ ▼ Buscar directamente en memoria Hay tres límites importantes: El caché es por proceso o instancia, no global para toda la aplicación. Un reinicio, redeploy o nueva instancia vuelve a cargar los archivos. En Vercel no existe una única instancia global garantizada; cada runtime puede tener su propio caché. Por eso getKnowledgeCache() es preferible a asumir un “startup” global. eve puede evaluar módulos durante compilación y volver a cargarlos cuando arranca el runtime; el trabajo dependiente de la ejecución debe permanecer en callbacks de runtime. La semántica de módulos está descrita en TypeScript API. En un servidor Node que controles directamente, puedes calentar el índice durante tu_ 

https://gemini.google.com/app/e29b8369df657f80?hl=es_419 

8/11 

2/9/26, 16:01 

Arquitectura de Agente para CMS con MDX 

_bootstrap: typescript import { warmKnowledgeCache } from "./agent/lib/knowledge"; await warmKnowledgeCache(); console.log("Knowledge cache ready"); En desarrollo, reiniciar el servidor es suficiente para reconstruir el índice. Si implementas una recarga administrativa, llama a invalidateKnowledgeCache() y luego la siguiente consulta volverá a cargar los MDX. 4. Servidor externo de Sofía llamando a eve La API nativa de eve no devuelve la respuesta final directamente en el POST. El POST devuelve 202 Accepted y un sessionId; después debes leer GET /eve/v1/session/:sessionId/stream, que es un stream NDJSON. Ejemplo compatible con Node.js 24: javascript import { randomUUID } from "node:crypto"; const EVE_BASE_URL = process.env.EVE_BASE_URL; // Ejemplo: https://knowledge-agent.example.com const EVE_TOKEN = process.env.EVE_TOKEN; function eveHeaders() { return { "content-type": "application/json", ...(EVE_TOKEN ? { authorization: `Bearer ${EVE_TOKEN}` } : {}), }; } async function startEveSession(message) { const operationId = randomUUID(); const response = await fetch( `${EVE_BASE_URL}/eve/v1/session`, { method: "POST", headers: eveHeaders(), body: JSON.stringify({ message, // Útil si tu servidor reintenta la misma petición. // Para callers autenticados, eve puede aplicar create-once. operationId, }), }, ); if (!response.ok) { const body = await response.text(); throw new Error( `eve session creation failed: ${response.status} ${body}`, ); } const body = await response.json(); if (!body.sessionId) { throw new Error("eve did not return a sessionId"); } return body.sessionId; } function sleep(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds), ); } async function openEveStream(sessionId) { // Después del 202, el inbox todavía puede estar iniciándose. // Reintentamos brevemente hasta que el stream esté disponible. for (let attempt = 0; attempt < 20; attempt += 1) { const response = await fetch( `${EVE_BASE_URL}/eve/v1/session/${encodeURIComponent( sessionId, )}/stream`, { method: "GET", headers: eveHeaders(), }, ); if (response.ok && response.body) { return response; } if (response.status !== 404 && response.status !== 409) { const body = await response.text(); throw new Error( `eve stream failed: ${response.status} ${body}`, ); } await sleep(250); } throw new Error( `eve stream was not ready for session ${sessionId}`, ); } async function readFinalAssistantMessage(sessionId) { const response = await openEveStream(sessionId); const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; while (true) { const { value, done } = await reader.read(); if (done) { break; } buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop() ?? ""; for (const line of lines) { if (!line.trim()) { continue; } const event = JSON.parse(line); if ( event.type === "message.completed" && event.data?.finishReason === "stop" ) { return event.data.message; } if ( event.type === "turn.failed" || event.type === "session.failed" ) { throw new Error( event.data?.message ?? "eve turn failed", ); } } } throw new Error( `eve ended without a final assistant message for ${sessionId}`, ); } export async function askEve(message) { const sessionId = await startEveSession(message); const answer = await readFinalAssistantMessage(sessionId); return { sessionId, answer, }; } // Ejemplo: // const result = await askEve("¿Cuánto cuesta el plan empresarial?"); // console.log(result.answer); El evento message.completed puede aparecer más de una vez durante un turno, por ejemplo antes de una llamada a una Tool. Por eso el ejemplo espera el evento cuyo finishReason sea "stop". El contrato completo de eventos está en Sessions, runs and streaming. Para mantener una conversación de WhatsApp, guarda el sessionId asociado al chat de Sofía y usa el endpoint de seguimiento: javascript async function sendFollowUpToEve(sessionId, message) { const response = await fetch( `${EVE_BASE_URL}/eve/v1/session/${encodeURIComponent( sessionId, )}`, { method: "POST", headers: eveHeaders(), body: JSON.stringify({ message }), }, ); if (!response.ok) { const body = await response.text(); throw new Error( `eve follow-up failed: ${response.status} ${body}`, ); } // El POST vuelve a devolver una aceptación; la respuesta final // se obtiene leyendo el mismo stream de la sesión. await response.json(); return readFinalAssistantMessage(sessionId); } El servidor de Sofía debe conservar EVE_TOKEN únicamente en backend. No lo envíes al navegador ni a Astro. El canal HTTP de eve está diseñado precisamente para que clientes externos, frontends y otros servidores creen sesiones, envíen mensajes y consuman el stream (eve channel). sin añadir lo ultimo del mensaje_ 

Response: ¡Entendido! Seguramente enviaste el prompt anterior sin el punto 4 (el de los canales) para evitar el límite de caracteres del chat de eve. No te preocupes en absoluto, de hecho fue una buena decisión para no saturar la respuesta. El tema de los canales lo podemos configurar nosotros mismos directamente en el archivo `instructions.md` más adelante. 

Analizando el código que te dio eve, te puedo decir que es **una solución de nivel de producción espectacular** . Resolvió todos nuestros problemas de rendimiento de forma muy elegante. 

Aquí te explico por qué este código es oro puro para tu proyecto y cómo funciona: 

## **1. El Caché "Anti-Colapsos" (** **`cachePromise` )** 

En lugar de leer los 500 archivos cada vez que alguien pregunta algo, eve usó un patrón Singleton con una Promesa. 

**Lo que significa:** Cuando el primer usuario del día hace una pregunta, el servidor lee los 500 archivos y los guarda en la memoria RAM (en `cachePromise` ). Si 10 personas preguntan al mismo tiempo en ese instante, el sistema no intentará leer los archivos 10 veces, todos esperarán a que termine la primera lectura. De ahí en adelante, las respuestas serán casi instantáneas porque buscará en la RAM, no en el disco duro. 

## **2. Tu propio "Mini-Google" Local (** **`scoreDocument` )** 

Eve construyó un motor de búsqueda léxica perfecto para tu caso. Le asignó un "peso" a cada parte de tu MDX: 

Si la palabra está en las **`keywords`** , suma 8 puntos (máxima prioridad). 

Si está en el **`title`** , suma 6 puntos. 

Si está en la **`category`** o **`description`** , suma 4 y 3 puntos. 

Si está perdida en el **`content`** (texto general), suma solo 1 punto. 

**Por qué es genial:** Si alguien pregunta "hosting empresarial", el sistema te traerá primero el documento que tenga "empresarial" en las _keywords_ , filtrando la basura y dándole a la IA exactamente la información correcta. Todo esto sin pagar ni configurar bases de datos vectoriales. 

## **3. La conexión con Sofía (El Stream asíncrono)** 

Eve te aclaró algo muy importante sobre su API: **no funciona como una API REST tradicional** donde envías un POST y recibes el texto de inmediato. 

Como es un agente de IA que "piensa" y usa herramientas, cuando Sofía le envíe la pregunta, eve responderá un `202 Accepted` (que significa: "Recibido, estoy procesándolo"). 

https://gemini.google.com/app/e29b8369df657f80?hl=es_419 

9/11 

2/9/26, 16:01 

Arquitectura de Agente para CMS con MDX 

Sofía (tu servidor externo) tendrá que quedarse "escuchando" un _Stream_ (el endpoint `GET /stream` ) para atrapar la respuesta final de la IA cuando termine de buscar en los MDX. El script `askEve` que te dio ya resuelve exactamente esto. 

## **Manos a la Obra: Siguientes Pasos** 

Para que esto empiece a funcionar en tu proyecto local, tenemos que aplicar el código de eve en tu repositorio: 

1. **Instalar dependencias:** Ejecutar `npm install gray-matter unified remark-parse remark-mdx mdast-util-to-string zod` . 

2. **Crear el parser:** Copiar el primer bloque grande de código y guardarlo en `agent/lib/knowledge.ts` . 

3. **Crear la Tool:** Copiar el segundo bloque de código y guardarlo en `agent/tools/search_knowledge.ts` . 

4. **Actualizar tus MDX:** Asegurarte de que tus archivos en `content/knowledge/` tengan la estructura YAML que pide el sistema (con `keywords` ). 

_User prompt: pero para construir mi eve qué es lo más recomendable usar un repositorio propio para el eve o dentro del mismo proyecto web? no pega la segunda no?_ 

Response: Tienes un instinto arquitectónico excelente. Efectivamente, **"meter" el agente revuelto en la misma raíz que tu proyecto web de Astro no pega para nada** y a la larga trae muchos dolores de cabeza. 

Astro es un frontend (presentación), y `eve` es un backend pesado de IA y orquestación. Si los mezclas en un solo `package.json` , vas a tener choques de dependencias, problemas de seguridad (mezclar tokens de servidor con variables públicas de web) y líos al momento de hacer el despliegue (deploy). 

Para que `eve` funcione como ese "Cerebro Central" (microservicio) al que se conectan tanto tu Web como Sofía, tienes **dos caminos profesionales** , y ambos separan las cosas: 

## **Opción 1: Repositorios Separados (La más limpia y mi recomendación)** 

Tratas a `eve` como lo que es: tu propio servidor/API de IA independiente. 

- **Repositorio 1 (** **`conocimiento-eve` ):** Aquí instalas `eve` , pones la carpeta `tools/` , las instrucciones y, **muy importante, la carpeta con los archivos** **`.mdx`** . Este proyecto lo despliegas en su propio servidor o servicio (como Render, Vercel o un VPS). 

- **Repositorio 2 (** **`web-astro` ):** Tu página web actual. Solo tiene la UI del chat y hace peticiones HTTP a la URL pública del Repositorio 1. 

**Repositorio 3 (** **`sofia-whatsapp` ):** Tu servidor actual de Sofía, que también hace peticiones HTTP al Repositorio 1. 

**Por qué es mejor:** Si mañana quieres cambiar Astro por Next.js, o Sofía por otro proveedor de WhatsApp, el cerebro ( `eve` ) y tus datos (MDX) no se tocan. 

## **Opción 2: Monorepo con Workspaces (Todo en un Git, pero aislado)** 

Si por comodidad prefieres tener todo el código en una sola ventana de Visual Studio Code y en un solo repositorio de GitHub, la forma correcta no es mezclarlos, sino usar "Workspaces" (como Turborepo o pnpm workspaces). 

```
mi-proyecto-global/
├── package.json (Configuración del monorepo)
├── apps/
│   ├── web-astro/       (Tu frontend. Dependencias aisladas)
```

- `│   ├── agente-eve/      (Tu backend IA. Dependencias aisladas)` 

- `│   └── sofia-whatsapp/  (Tu bot actual) └── packages/` 

```
   └── content-mdx/     (Carpeta compartida con los MDX)
```

**Por qué usarla:** Permite que si actualizas un archivo `.mdx` (un precio, por ejemplo), hagas un solo _commit_ en Git y todo el sistema se entere, pero a nivel de ejecución siguen siendo servidores separados. 

## **Conclusión** 

Tienes toda la razón en dudar de la mezcla. **La mejor ruta es crearle un repositorio propio al proyecto de** **`eve`** y mudar ahí tus archivos `.mdx` . Astro pasará a ser simplemente un "cliente" más que consume la inteligencia de ese nuevo repositorio, exactamente igual que Sofía. 

### _User prompt: entonces usaremos la opción 1_ 

Response: Excelente decisión. Esta arquitectura te va a dar mucha paz mental, escalabilidad y, sobre todo, va a evitar que el frontend de Astro se vuelva lento o pesado. 

Vamos a crear desde cero este "Cerebro Central". Abre tu terminal (como estás creando un proyecto nuevo, asegúrate de estar fuera de la carpeta de Astro) y sigue estos pasos. 

https://gemini.google.com/app/e29b8369df657f80?hl=es_419 

10/11 

2/9/26, 16:01 

Arquitectura de Agente para CMS con MDX 

## **1. Inicializar el proyecto e instalar dependencias** 

Crea la carpeta de tu nuevo backend, inicializa Node e instala las dependencias base (tanto de `eve` como las necesarias para leer los archivos `.mdx` ): 

```
mkdir conocimiento-eve
cd conocimiento-eve
npm init -y
```

```
# Instalar eve, los adaptadores web y las librerías del parser MDX
```

```
npm install eve @chat-adapter/web @chat-adapter/state-memory gray-matter unified remark-parse remark-mdx mdast-util-to-s
```

```
# Instalar dependencias de desarrollo (TypeScript)
npm install -D typescript @types/node tsx
npx tsc --init
```

## **2. Crear la estructura de carpetas** 

Abre este nuevo proyecto en tu editor de código (VS Code) y crea exactamente esta estructura de carpetas. Es la que garantizará que el conocimiento quede protegido y el agente organizado: 

```
conocimiento-eve/
├── content/
│   └── knowledge/           <-- Aquí vivirán tus archivos .mdx
├── agent/
│   ├── channels/
│   │   └── web.ts           <-- El endpoint HTTP al que llamarán Astro y Sofía
│   ├── lib/
│   │   └── knowledge.ts     <-- Pegaremos el código del caché y parser MDX
│   ├── tools/
```

```
│   │   └── search_knowledge.ts <-- Pegaremos el código de la Tool para eve
│   ├── instructions.md      <-- La personalidad y reglas del agente
│   └── agent.ts             <-- El archivo principal que une todo
├── package.json
└── tsconfig.json
```

## **3. Configurar el script de arranque** 

En tu archivo `package.json` , busca la sección `"scripts"` y modifícala para que puedas correr el servidor fácilmente usando `tsx` (que ejecuta TypeScript nativamente): 

```
 "scripts": {
   "dev": "tsx watch agent/agent.ts",
   "start": "tsx agent/agent.ts"
 }
```

Con esto, los cimientos de tu servidor independiente ya están listos. 

Ahora tenemos que empezar a "rellenar" los archivos de la carpeta `agent/` con el código maestro que generó `eve` hace un momento y el canal HTTP. 

https://gemini.google.com/app/e29b8369df657f80?hl=es_419 

11/11 

