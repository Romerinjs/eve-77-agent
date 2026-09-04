# Changelog - 77 Studio Web Platform

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/), y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased] - 2026-09-03

### Added
- **Arquitectura de Internacionalización Bilingüe Nativa en Astro v5 (`src/lib/i18n/`, `src/pages/en/`)**:
  - Configuración nativa i18n en `astro.config.mjs` con `defaultLocale: 'es'`, `locales: ['es', 'en']` y prefijo deshabilitado para idioma por defecto (`prefixDefaultLocale: false`).
  - Creación de diccionarios tipados centralizados en `src/lib/i18n/` para cadenas globales (`ui.ts`), utilidades de cálculo de ruta y traducción (`utils.ts`) y diccionarios modulares por página (`src/lib/i18n/pages/{home,marketing,web,ia-automatizacion,productos-digitales,nosotros,contacto}/`).
  - Creación del árbol de páginas en inglés bajo `src/pages/en/` para las 7 rutas principales (`/en/`, `/en/marketing`, `/en/web`, `/en/ia-automatizacion`, `/en/productos-digitales`, `/en/nosotros`, `/en/contacto`).
  - Switch interactivo de idioma `ES / EN` en el Header (`Header.astro`) con cálculo dinámico de la ruta espejo activa.
  - Adaptación bilingüe de todos los componentes globales y de sección ([HeroHome](file:///c:/Users/ACER/Documents/OIDUTS-88/projects/web-77-studio/src/components/home/HeroHome.astro), [HeroMarketing](file:///c:/Users/ACER/Documents/OIDUTS-88/projects/web-77-studio/src/components/marketing/HeroMarketing.astro), [HeroWeb](file:///c:/Users/ACER/Documents/OIDUTS-88/projects/web-77-studio/src/components/web/HeroWeb.astro), [HeroIA](file:///c:/Users/ACER/Documents/OIDUTS-88/projects/web-77-studio/src/components/ia/HeroIA.astro), [HeroProductos](file:///c:/Users/ACER/Documents/OIDUTS-88/projects/web-77-studio/src/components/productos/HeroProductos.astro), [HeroNosotros](file:///c:/Users/ACER/Documents/OIDUTS-88/projects/web-77-studio/src/components/nosotros/HeroNosotros.astro), [HeroContacto](file:///c:/Users/ACER/Documents/OIDUTS-88/projects/web-77-studio/src/components/contacto/HeroContacto.astro), [DualCTA](file:///c:/Users/ACER/Documents/OIDUTS-88/projects/web-77-studio/src/components/DualCTA.astro), [ContactForm](file:///c:/Users/ACER/Documents/OIDUTS-88/projects/web-77-studio/src/components/ContactForm.astro), [AIChatWidget](file:///c:/Users/ACER/Documents/OIDUTS-88/projects/web-77-studio/src/components/chat/AIChatWidget.astro), [MobileStickyBar](file:///c:/Users/ACER/Documents/OIDUTS-88/projects/web-77-studio/src/components/MobileStickyBar.astro) y más de 30 subcomponentes interactivos).
  - Enlaces y mensajes contextuales de WhatsApp bilingües en `src/utils/whatsapp.ts`.
  - Validación de compilación exitosa con 14 rutas estáticas prerenderizadas en `npm run build`.

### Changed
- **Adaptación del Widget de Chat Web a Sofía AI (`AIChatWidget.astro`, `chat-widget.ts`, `chat-widget.css`, `/api/chat.ts`)**:
  - Actualización de identidad oficial a **Sofía AI 77 Studio**.
  - Header: Título `Sofía AI 77 Studio` con insignia oficial de verificación (`verified.webp`), foto de perfil personalizada (`profile-sofia-pic.jpg`), punto de conexión en esquina inferior derecha con tooltip interactivo (*Conectado* / *Offline*) y eliminación del subtítulo redundante.
  - Botón flotante disparador (estado cerrado): Relleno morado degradado de marca con el logotipo oficial blanco `77studio.png` y punto de conexión verde.
  - Mensaje de bienvenida oficial orientado a calificación y soporte comercial para los 4 servicios de 77 Studio.
  - Implementación de 4 preguntas frecuentes sugeridas estructuradas (`QUICK_QUESTIONS`) con íconos (`🚀`, `💼`, `⚡`, `💬`), textos legibles y disparo reactivo de queries al hacer clic.
  - Input con placeholder `"Escribe tu consulta para Sofía..."` y mejora de estilos de micro-interacción en píldoras y tarjetas de estado.

### Added
- **Agente de IA Chat Flotante & Proxy Serverless (`AIChatWidget.astro`, `chat-widget.ts`, `/api/chat`)**:
  - Implementación del componente nativo de Astro `<AIChatWidget />` en **Tema Claro (Light Theme)** con soporte de streaming SSE en tiempo real conectado al backend de Eve (`eve-77-agent`).
  - Motor de cliente nativo TypeScript (`chat-widget.ts`) de solo ~3.5 KB gzipped (cero overhead de React): Smart Auto-Scroll, persistencia de `sessionStorage`, `threadId` único por sesión, botones interactivos *pill* de WhatsApp (`.chat-wa-pill`), formateo de Markdown y sanitización estricta de marcadores de stream `[DONE]`.
  - Endpoint proxy serverless en Astro (`src/pages/api/chat.ts`) para retransmitir streams bidireccionales y realizar health checks `GET` en vivo, eliminando problemas de preflight CORS en navegadores.
  - Transparencia total de conexión: eliminación de datos precargados falsos y diagnóstico de errores en tiempo real.
- **Base de Conocimiento MDX Home (`77/01-home/index.mdx`)**:
  - Creación y estandarización del archivo de conocimiento completo para el Home de 77 Studio bajo el estándar de la skill `77-mdx-builder`, incluyendo Frontmatter YAML 100% tipado, métricas validadas (+310% leads, <45s respuesta, -42% CAC, 100% ROI), ecosistema de 4 pilares, casos de negocio, testimonios y canales de conversión.

### Changed
- **Sistema Global de Animaciones On-Scroll (Todas las vistas y secciones)**:
  - Implementación integral del motor de animación basado en `IntersectionObserver` (`data-text-reveal`, `data-opai-animate`, `data-delay` escalonado) en **absolutamente todas las secciones de cada módulo** (`/`, `/marketing`, `/web`, `/ia-automatizacion`, `/productos-digitales`, `/nosotros`, `/contacto`).
  - Activación reactiva con soporte completo para navegación de cliente mediante `astro:page-load` y `DOMContentLoaded` en `animations.ts`.
- **Módulo 07 (Contacto `/contacto`)**:
  - **Hero Contacto (`HeroContacto.astro`)**: Eliminación de la tarjeta secundaria de información inferior (*Tiempo promedio de respuesta: < 2 horas, Sedes, Garantía NDA*), optimizando el espacio visual y focalizando la atención en la tarjeta comercial de WhatsApp y el formulario de contacto.
  - **Preguntas Frecuentes (`FAQContacto.astro`)**: Eliminación del badge superior `PREGUNTAS FRECUENTES` y transformación de la sección en un **acordeón interactivo fluido** (cerrado por defecto) que revela la respuesta completa al hacer clic, con contenedor de icono `ChevronDown` rotatorio, micro-interacción morada al abrirse y cierre automático inteligente entre elementos para máxima claridad.
- **Módulo 06 (Sobre Nosotros `/nosotros`)**:
  - **Hero Nosotros (`HeroNosotros.astro`)**: Implementación de un **carrusel animado de fondo (cross-fade cada 5s) con las 3 imágenes oficiales de 77 Studio** (`77-scaled.jpg`, `IMG_1098-scaled.jpeg`, `IMG_1101-scaled.jpeg`) estructuradas mediante etiquetas `<img>` directas y niveles de capas `z-index` positivos (`z-0` para imágenes, `z-[1]` para capa translúcida blanca al 65%-80% de opacidad, `z-10` para contenido y tarjetas) logrando un balance perfecto entre visibilidad fotográfica del estudio y nitidez de lectura, eliminación del marco contenedor superior (`77 Studio Operating System`) y barra de estado, **desacoplamiento total de las 3 tarjetas operativas de forma independiente y limpia** (`Estrategia & Contenido`, `Desarrollo Web & SaaS`, `Automatización & IA`), y eliminación de las etiquetas/textos inferiores secundarios.
  - **Línea de Evolución (`EvolutionTimeline.astro`)**: Eliminación de la etiqueta superior `// Nuestra Trayectoria`, centrado de cabecera, eliminación de subtítulos y checks inferiores, destacando los números de etapa (`01` al `04`) en púrpura de marca (`text-opai-purple`).
  - **Filosofía de Trabajo (`PhilosophySection.astro`)**: Eliminación de la etiqueta superior `// Nuestra Filosofía`, centrado de cabecera, eliminación de tags de categoría y checks inferiores, e incorporación de **iconos vectoriales en contenedor negro** (`bg-background-13 text-white`) con micro-interacción al hover (`hover:border-b-opai-purple`).
  - **Disciplinas Integradas (`TeamCapabilitiesGrid.astro`)**: Transformación de la sección en un **Carrusel Infinito de Fila Única que se desplaza automáticamente hacia la derecha** (con pausa al hover, soporte para drag/touch y flechas manuales de navegación) junto a un **botón switch interactivo de alternancia rápida** que conmuta fluidamente entre el modo carrusel y la **vista por cuadrícula de 3x2 tarjetas**, manteniendo la estética con iconos en contenedor negro.
  - **Presencia Internacional (`GlobalPresenceSection.astro`)**: Eliminación de la etiqueta superior `// Cobertura Internacional`, centrado de cabecera, modernización de las tarjetas de sedes (Colombia y Estados Unidos) con **iconos en contenedor negro** (`Globe`, `MapPin`) y bullets limpios.
- **Módulo 05 (Productos Digitales `/productos-digitales`)**:
  - **Hero Productos (`HeroProductos.astro`)**: Eliminación del badge de cabecera (`Módulo 05`), centrado de textos, eliminación de los trust checks inferiores (`Product Studio, no Fábrica Tradicional`, etc.), eliminación del recuadro de arquitectura del sidebar (`ARQUITECTURA MODERNA`), y habilitación de **4 módulos interactivos con datos estáticos en el mini sistema** (`Dashboard Central`, `Módulos de Clientes`, `Bases de Datos & APIs`, `Reportes en Vivo`) con navegación fluida y reactiva.
  - **Soluciones Digitales (`ProductSolutionsGrid.astro`)**: Eliminación de etiquetas superiores (`CATÁLOGO DE DESARROLLO`), etiquetas de solución (`SOLUCIÓN 01`), textos de "Arquitectura propietaria" y de badges/listas internas; implementación de la distribución de tarjetas del home (**cuadrícula editorial de 12 columnas: 3 tarjetas superiores de 4 columnas + 2 tarjetas inferiores de 6 columnas**) con **iconos vectoriales blancos dentro de contenedores negros** (`bg-background-13 text-white`), micro-interacción de borde inferior morado al hover (`hover:border-b-opai-purple`), e **integración del banner de conversión y CTA** en el pie de sección.
  - **Diagnóstico Operativo (`ProductPainPointsSection.astro`)**: Eliminación de la sección completa "Cuando el software comercial genérico queda corto" y unificación del flujo en la página principal del módulo.
  - **Metodología de 5 Pasos (`ProductProcessSection.astro`)**: Eliminación de etiquetas superiores (`METODOLOGÍA DE PRODUCTO`), etiquetas laterales (`Entendemos`, etc.) e hitos entregables (`Hito entregable ✓`); rediseño de las 5 tarjetas con **mayor espaciado horizontal, padding cómodo y números de paso destacados** (`01` al `05`) para máxima legibilidad.
  - **Casos de Producto Reales (`ProductCasesSection.astro`)**: Eliminación de etiquetas y emojis; transformación de las tarjetas en **3D Flip Coin Cards interactivas** con dos caras: **Frente (El Reto) en fondo negro** (`bg-[#0c0c14] text-white`) con la **descripción del problema formateada directamente como titular en negrita (`font-sora text-xl sm:text-2xl font-bold`)** y **badge enfático en rojo/coral de alto contraste con punto pulsante**, y **Reverso (La Solución) en fondo blanco** (`bg-white text-background-13`) que revela el título de la plataforma construida y la métrica de impacto con **badge enfático en esmeralda**, logrando máximo impacto visual en la lectura del problema y solución.
  - **Por qué 77 Studio (`ProductWhyUsSection.astro`)**: Eliminación de etiquetas de categoría y checks inferiores, estandarización de las tarjetas con iconos en contenedor negro y micro-interacción morada al hover.
- **Módulo 04 (IA + Automatización `/ia-automatizacion`)**:
  - **Hero IA (`HeroIA.astro`)**: Implementación de la imagen de fondo personalizada `ia-automatizacion-hero.webp` con capa de opacidad blanca reforzada (`bg-white/80`) para máxima claridad, eliminación del marco principal contenedor, de la barra superior y de las etiquetas de paso sobre las tarjetas, disponiendo las **4 tarjetas de nodos de forma independiente y limpia** con contenedores de icono en fondo negro con vector blanco puro (`bg-background-13 text-white`), fondos blancos translúcidos (`bg-white/95 backdrop-blur-md`) y tipografía en negro de alto contraste.
  - **Capacidades Tecnológicas (`IACapabilitiesGrid.astro`)**: Eliminación de la etiqueta superior `// Soluciones Tecnológicas Aplicadas`, eliminación de la numeración (`01`-`04`), badges (`Ventas & Conversión`, etc.) y pie de tarjeta, conversión de cada tarjeta en un enlace clicable con `href="#"`, e incorporación de iconos en vector blanco dentro de contenedor negro (`bg-background-13 text-white`) con borde inferior morado al hover (`hover:border-b-opai-purple`).
  - **Workflow Pipeline (`WorkflowDiagramSection.astro`)**: Eliminación de la etiqueta superior `// Anatomía de un Workflow Real`, eliminación del tag `Filosofía 77 Studio`, **limpieza total de las 4 tarjetas de flujo eliminando etiquetas superiores/derechas y la barra inferior de ejecución**, incorporación de **línea segmentada con gradiente y animación continua de desplazamiento hacia la derecha (`stroke-dashoffset`) con conectores de chevron entre tarjetas**, micro-interacción con borde inferior morado al hover (`hover:border-b-opai-purple`), y rediseño de la tarjeta de principio clave con **degradado de identidad 77 Studio** (`bg-gradient-to-r from-[#0c0c14] via-[#1a0f2e] to-[#2a0e4a]`), integrando el **logo oficial de 77 Studio** directamente debajo del titular en alto impacto.
  - **Comparativa Automatización vs IA (`AutomationVsAISection.astro`)**: Eliminación de etiquetas superiores y laterales (`Lógica Determinista`, `100% Predecible`, `Cognición Contextual`, `Comprensión Natural`), iconos en contenedor negro con trazo blanco, transformación de las tarjetas en **acordeones interactivos cerrados por defecto** que despliegan la descripción y principios al clic, e incorporación de **logos centrados de plataformas con tooltips descriptivos** (Make, n8n, Zapier para Automatización; OpenAI, Claude, LangChain para Inteligencia Artificial).
  - **Metodología de Implementación (`IAProcessSection.astro`)**: Eliminación de la etiqueta superior `// Metodología de Ingeniería` y transformación de la sección en la **Línea Orbital Interactiva de 6 Pasos** con arco SVG de gradiente continuo, 6 nodos circulares (`01` al `06`) con rotación automática cada 5s y selección manual reactiva para actualizar la tarjeta central flotante, además de cuadrícula responsiva para móviles.
- **Módulo 03 (Desarrollo Web `/web`)**:
  - **Hero Web (`HeroWeb.astro`)**: Implementación de la imagen de fondo personalizada `web-hero.jpg` con opacidad blanca reducida (`bg-white/60`) para mayor presencia fotográfica, eliminación del marco principal contenedor y de la barra de etiquetas superior (`tuempresa.com`, `Lighthouse`, `Vercel CDN`), disponiendo las **5 tarjetas pequeñas de forma totalmente independiente e individual** con elevación glassmorphism (`bg-white/95 backdrop-blur-md`).
  - **Arquitectura Digital (`WebSolutionsGrid.astro`)**: Ampliación del ancho máximo del contenedor del encabezado (`max-w-5xl`) para evitar saltos de línea antiestéticos en el título, eliminación de la etiqueta superior, eliminación de números/badges/iconos y del tag inferior `Explorar solución →`, incorporación de micro-interacción de borde inferior morado de branding al hacer hover (`hover:border-b-opai-purple`), e integración de **imágenes de fondo temáticas (`analitica-cro.jpg`, `funnels.webp`, `integraciones.jpg`, `landings.png`, `rediseño-web.jpg`, `web-corporativa.jpg`) que emergen con un 75% de opacidad y zoom sutil al pasar el cursor sobre cada tarjeta**, asegurando máxima legibilidad tipográfica.
  - **Puntos de Dolor (`WebPainPointsSection.astro`)**: Estructuración en cuadrícula horizontal continua 5x1 alineada (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5`) con **función interactiva de acordeón** en cada tarjeta para desplegar/ocultar la solución, eliminación del texto/etiqueta "Solución 77" para presentar el texto directo y simplificado, eliminación total de numeración y colores estridentes, con borde inferior morado de énfasis al hover (`hover:border-b-opai-purple`).
  - **Pilares de Construcción Web (`WebDesignPillars.astro`)**: Implementación de motor de **loop infinito continuo a 60/120fps** ultra suave (`requestAnimationFrame`) con desplazamiento horizontal constante, sin cortes ni saltos al reiniciar el ciclo, con pausa inteligente al hover/touch, soporte táctil/arrastre con inercia (`momentum velocity`), botones anterior/siguiente y micro-interacción de borde inferior morado (`hover:border-b-opai-purple`).
  - **Metodología de Desarrollo en 5 Pasos (`WebProcessSection.astro`)**: Eliminación de la etiqueta `// Metodología de Desarrollo`, implementación de la línea orbital interactiva con curva SVG de gradiente y 5 nodos (`01` al `05`) con rotación automática cada 5s y selección manual reactiva para actualizar la tarjeta activa de cristal.
- **Sección de Contacto & Formulario (`ContactSection.astro`, `HeroContacto.astro`, `ContactForm.astro`, etc.)**: Implementación de la imagen de fondo personalizada (`backgorund-contacto.jpg`) con capa superpuesta de fundido oscuro y desenfoque sutil (`bg-black/75 backdrop-blur-[2px]`), ajuste de títulos y párrafos a blanco de alto contraste (`text-white`), eliminación de etiquetas de cabecera redundantes ("CONVERSACIÓN DIRECTA", "FORMULARIO DE EVALUACIÓN", "Módulo 07"), eliminación de emojis en detalles de atención comercial, y estandarización de la tarjeta de WhatsApp a título limpio "Respuesta Inmediata" sin subtítulo ni iconos redundantes en el botón.
- **Header Principal (`Header.astro`)**: Simplificación del logotipo en la barra de navegación superior removiendo la etiqueta secundaria `COL ↔ USA` para una estética más limpia y minimalista.
- **Módulo 01 (Home `/`)**:
  - Rediseño de la sección **El Reto Digital** (`PainPointsSection.astro`) para adoptar la estructura de cuadrícula y tarjetas del catálogo de soluciones: título centrado, eliminación de numeración y etiquetas secundarias, adición de iconos vectoriales geométricos en contenedores oscuros, síntesis de textos y conversión de tarjetas en enlaces clicables directos a `#contacto`.
  - Reemplazo de la placa de integración con emoji en el home (`MetricsAndIntegrations.astro` e `index.html`) por un encabezado H2 limpio y normal sin emojis.
  - Corrección matemática en el bucle del carrusel de integraciones (`MetricsAndIntegrations.astro` e `index.html`) para usar el offset del primer elemento duplicado en lugar de la mitad del scrollWidth, eliminando cortes visuales e inestabilidad en la animación infinita.
  - Implementación de micro-interacción reactiva en los botones píldora (`.button`): el icono se desliza de izquierda a derecha y el texto se desplaza proporcionalmente a la izquierda al hacer hover, usando cálculos geométricos dinámicos en `src/scripts/animations.ts` y transiciones optimizadas en `src/styles/global.css`.
  - Fusión de las secciones **Un Solo Partner Digital** (`EcosystemSection.astro`) y **Servicios Integrados** (`SolutionsGrid.astro`) en un solo bloque unificado en la home, eliminando la sección duplicada y el badge superior. Se implementó la imagen de fondo con destello púrpura (`opai-35.jpg`) añadiendo sombras (`drop-shadow`) y grosor medio a los textos principales para una alta legibilidad. Las tarjetas ahora se organizan en 4 columnas verticales que se expanden al pasar el cursor (`hover:scale-[1.035]`), removiendo la etiqueta 'Capacidad XX' y estructurándolas en: Título, descripción breve, listado de características con checks vectoriales y el botón interactivo `.button` en la base.
  - Reemplazo de las 3 imágenes flotantes secundarias del Hero (`HeroHome.astro`) por las imágenes personalizadas (`marketing1.png`, `desarrollo.png`, `filmmaking.png`) aplicando un escalado de `scale-[1.65]` en CSS para recortar los márgenes blancos que vienen en el lienzo de los archivos y centrar la fotografía en el contenedor.
  - Ampliación de las tarjetas de capacidad en `EcosystemSection.astro` mediante el aumento del contenedor a `max-w-[1400px]`, incremento del padding a `p-6 sm:p-8 xl:p-9` y reconfiguración de la cuadrícula a `xl:grid-cols-4` para dar mayor holgura y lecturabilidad al texto.
  - Adición de la sección de **Testimonios Reales & Prueba Social** (`TestimonialsSection.astro`) en el home, ubicada debajo de casos de negocio, adaptada completamente al tema claro y branding de la marca (fondo claro slate-50, tarjetas blancas, textos oscuros de alta legibilidad, logotipos corporativos en gris unificado reactivo al hover). Se redujo la opacidad del fondo blanco sobrepuesto para lucir más las fotos de fondo, se removió la etiqueta superior de cabecera y se corrigió el error en el bucle continuo de la columna central (desplazamiento descendente) duplicando las tarjetas para superar la altura del visor e inicializando su desplazamiento en `-halfHeight` para evitar saltos.
  - Rediseño e implementación de la sección **Cómo Trabajamos** (`ProcessSection.astro`): corregida la geometría de posición de los nodos 02 y 03 (`left: 18%` y `left: 82%`) y el ancho de la tarjeta activa de cristal (`max-w-md`) eliminando por completo cualquier sobreposición o colisión de texto/nodos. Se removieron los badges morados con fondo/borde enfatizado y los textos redundantes de "Paso 01/02/03", transformando la palabra clave ("Entendemos", "Proponemos", "Creamos", "Optimizamos") en un título principal limpio y estandarizado con subtítulo descriptivo tanto en la tarjeta orbital desktop como en las 4 tarjetas de la vista móvil.
  - **Casos de Negocio & Resultados** (`CasesSection.astro`):
    - Eliminación de emojis en toda la sección (conmutador, tarjetas y badges de métricas).
    - Eliminación de la etiqueta superior "CASOS DE NEGOCIO & RESULTADOS" en la cabecera.
    - Eliminación de los botones individuales de solución en cada tarjeta.
    - Simplificación estética de las tarjetas: eliminación de cuadros/contenedores anidados interiores y subtítulos redundantes ("Nuestra Solución", "El Reto", "Resultado"), dejando una estructura limpia de título, descripción directa y métrica separada por un borde sutil.
    - Corrección del estado hover en el conmutador de Reto / Solución mediante clases CSS dedicadas (`.is-active`), evitando texto negro sobre fondo negro.
    - Implementación de animación 3D **Flip Coin** (`rotateY(180deg)` con aceleración elástica `cubic-bezier(0.34, 1.25, 0.64, 1)`): la tarjeta inicia en color negro (`bg-background-13`) para el estado **El Reto** y da la vuelta en 3D revelando la cara blanca (`bg-white`) para **Nuestra Solución**.
    - Estandarización visual con las fuentes y tokens oficiales del branding (`font-sora`, `font-inter-tight`, `font-ibm-plex-mono`).
    - Ajuste cromático con énfasis en las descripciones de las tarjetas de casos: texto de "El Reto" en rojo de alto contraste (`text-red-400 font-medium`) sobre la tarjeta oscura y descripción de "Nuestra Solución" en verde esmeralda sofisticado (`text-emerald-700 font-medium`) sobre la tarjeta blanca.
    - Visualización exclusiva de métricas de impacto: la línea de resultados comerciales al pie se muestra únicamente en el estado "Nuestra Solución" (cara blanca) y se omite en "El Reto" (cara oscura).

### Added
- **Módulo 07 (Contacto Directo `/contacto`)**: Implementación integral de la página modular de Contacto y Diagnóstico Comercial según especificación `77/07-contacto`:
  - `<HeroContacto />`: Layout de 2 columnas de alta conversión sin distracciones (Card destacada de WhatsApp Business + Formulario comercial guiado con tracking de origen y tiempo medio de respuesta < 2 horas).
  - `<FAQContacto />`: Bloque de 4 preguntas frecuentes estratégicas para tráfico de alta intención (proceso inicial, clientes internacionales, firma de NDA mutuo y tiempos de entrega).
  - Página `src/pages/contacto.astro` con metadatos SEO completos y enrutamiento estático en Astro 5.
- **Módulo 06 (Acerca de Nosotros `/nosotros`)**: Implementación integral de la página modular de Presentación Institucional y Equipo según especificación `77/06-nosotros`:
  - `<HeroNosotros />`: Propuesta de valor institucional (*"Un equipo creativo y tecnológico construido para resolver retos digitales"*), modelo operativo en 3 hubs integrados y CTAs duales con mensaje prellenado de WhatsApp para Nosotros.
  - `<EvolutionTimeline />`: Trayectoria y madurez técnica en 4 etapas (Raíz Creativa → Paid Media & Performance → Ingeniería Web Astro → Automatización, IA & Product Studio).
  - `<PhilosophySection />`: Los 4 principios fundamentales de trabajo (*Cero Humo Tecnológico*, *Creatividad + Código en la misma mesa*, *Obsesión por la Ejecución Ágil*, *Propiedad Total para el Cliente*).
  - `<TeamCapabilitiesGrid />`: Catálogo de las 6 disciplinas integradas del equipo (Estrategia, Paid Media, Audiovisual, Web Frontend, Automatización CRM, IA & RAG).
  - `<GlobalPresenceSection />`: Cobertura internacional y sedes activas Colombia (Medellín/Bogotá) ↔ Estados Unidos (Miami/Global).
  - `<NosotrosContactSection />`: Bloque de cierre comercial con WhatsApp directo a founders y formulario con `originPage="nosotros"`.
  - Página `src/pages/nosotros.astro` con metadatos SEO completos y enrutamiento estático en Astro 5.
- **Módulo 05 (Productos Digitales, SaaS & Dashboards `/productos-digitales`)**: Implementación integral de la página modular de Product Studio & Software a la Medida según especificación `77/05-productos-digitales`:
  - `<HeroProductos />`: Propuesta de valor de Product Studio, showcase interactivo de arquitectura SaaS multi-tenant con métricas en vivo y CTAs duales con mensaje prellenado de WhatsApp para productos digitales.
  - `<ProductSolutionsGrid />`: Catálogo de las 5 soluciones a la medida (SaaS & MVP, Portales & Plataformas de autogestión, Dashboards Analíticos, Herramientas Internas seguras, Aplicaciones Web Personalizadas).
  - `<ProductPainPointsSection />`: Comparativa "Cuando el Software Comercial Tradicional queda corto" vs "Solución a la Medida 77 Studio" (código propietario, sin cobro por asientos, adaptado al negocio).
  - `<ProductProcessSection />`: Metodología de producto en 5 pasos (Entendemos → Diseñamos → Construimos → Lanzamos → Evolucionamos).
  - `<ProductCasesSection />`: Casos de producto reales (SaaS B2B industrial, Portal de clientes mayorista, Dashboard financiero en tiempo real, Web App de logística).
  - `<ProductWhyUsSection />`: Visión de negocio integral (UX/UI de nivel mundial, funnels de adquisición, automatización e IA integrada).
  - `<ProductContactSection />`: Bloque de cierre comercial con consultoría técnica por WhatsApp y formulario con `originPage="productos-digitales"`.
  - Página `src/pages/productos-digitales.astro` con metadatos SEO completos y enrutamiento estático en Astro 5.
- **Módulo 04 (IA + Automatización de Procesos `/ia-automatizacion`)**: Implementación integral de la página modular de Inteligencia Artificial y Automatización de Procesos según especificación `77/04-ia-automatizacion` y directrices de diseño sin clichés:
  - `<HeroIA />`: Propuesta de valor de operaciones inteligentes, showcase interactivo de arquitectura de 4 nodos conectados (`Lead Trigger` → `Agente IA & Scoring` → `CRM Hub` → `Acción & Asesor Humano`) y CTAs duales con mensaje prellenado de WhatsApp para IA.
  - `<IACapabilitiesGrid />`: Grid de las 4 capacidades prácticas de tecnología (Automatización Comercial & CRM, Atención & Soporte Contextual 24/7, Procesos & Operaciones Internas, Inteligencia Artificial Aplicada con RAG).
  - `<WorkflowDiagramSection />`: Anatomía de un workflow real de lead a reunión en &lt; 30 segundos y bloque de sinergia entre equipo humano y automatizaciones.
  - `<AutomationVsAISection />`: Comparativa visual y técnica: Lógica Determinista (Make/n8n) vs. Inteligencia Artificial Cognitiva (LLMs/RAG).
  - `<IAProcessSection />`: Metodología en 6 pasos (Entendemos → Detectamos → Diseñamos → Implementamos → Probamos → Mejoramos).
  - `<IAContactSection />`: Bloque de cierre comercial con consultoría técnica ágil por WhatsApp y formulario con `originPage="ia-automatizacion"`.
  - Página `src/pages/ia-automatizacion.astro` con metadatos SEO completos y enrutamiento estático en Astro 5.
- **Módulo 03 (Desarrollo Web & Landing Pages `/web`)**: Implementación integral de la página modular de Desarrollo Web de Alta Conversión según especificación `77/03-web`:
  - `<HeroWeb />`: Propuesta de valor de ingeniería web, métricas Lighthouse (100/100, &lt;0.6s TTI), showcase interactivo de navegador desktop + marco mobile y CTAs duales con mensaje prellenado de WhatsApp para desarrollo web.
  - `<WebSolutionsGrid />`: Grid de las 6 soluciones especializadas (Web Corporativa, Landing Pages, Rediseño & Modernización, Funnels de Venta, Integraciones Tech & CRM, Analítica Avanzada & CRO).
  - `<WebPainPointsSection />`: Diagnóstico visual "El Problema de la Web Tradicional" (Oferta confusa, lentitud de carga, fricción móvil, formularios eternos, desconexión comercial) vs. Solución 77 Studio.
  - `<WebDesignPillars />`: Los 5 pilares de ingeniería web (Claridad Inmediata, Confianza & Autoridad, Conversión Dual CRO, Velocidad Extrema en Astro 5, Mobile-First Riguroso) con tarjeta de Garantía Técnica Core Web Vitals 95+.
  - `<WebProcessSection />`: Metodología en 5 pasos (Entendemos → Estructuramos → Diseñamos → Desarrollamos → Lanzamos).
  - `<WebContactSection />`: Bloque de cierre comercial con asesoría técnica directa por WhatsApp y formulario con `originPage="web"`.
  - Página `src/pages/web.astro` con metadatos SEO completos y enrutamiento estático en Astro 5.
- **Módulo 02 (Marketing `/marketing`)**: Implementación integral de la página modular de Marketing Digital, Meta Ads & Google Ads según especificación `77/02-marketing`:
  - `<HeroMarketing />`: Propuesta de valor de Paid Media, dashboard interactivo con métricas en vivo (ROAS 4.62x, CTR 3.85%, CPL -34%) y CTAs duales con mensaje prellenado de WhatsApp para Marketing.
  - `<CapabilitiesGrid />`: Grid 2x5 con las 10 capacidades integradas (Estrategia, Meta Ads, Google Ads, Branding, Contenido, Video/Hooks, Contenido con IA, Automatización de Publicaciones, Email Marketing, SMS Marketing).
  - `<PPCComparisonSection />`: Comparativa visual "Pautar no es solo activar anuncios" (Campañas tradicionales desconectadas vs. Sistema Conectado 77 Studio con CAPI y alta velocidad).
  - `<ChannelsComparison />`: Sinergia de canales complementarios: Meta Ads (Generación de Demanda) + Google Ads (Captura de Intención de Búsqueda).
  - `<CreativeShowcase />`: Mosaico visual de formatos y hooks de alta retención (Videos de 3s, Estáticos de contraste, Carruseles educativos, Variantes con IA para A/B testing).
  - `<MarketingProcess />`: Metodología en 4 pasos (Entendemos → Diseñamos → Lanzamos → Optimizamos).
  - `<MarketingContactSection />`: Bloque de cierre comercial enfocado en auditoría y estrategia de pauta con WhatsApp contextual y formulario con `originPage="marketing"`.
  - Página `src/pages/marketing.astro` con metadatos SEO completos y enrutamiento estático en Astro 5.
- **Módulo 01 (Home `/`)**: Implementación integral de la página principal según especificación `77/01-home`:
  - `<HeroHome />`: Propuesta de valor, métricas operativas en vivo y CTAs duales de conversión.
  - `<InternationalPresence />`: Banner de cobertura global Colombia (Medellín/Bogotá) ↔ Estados Unidos (Miami/Global).
  - `<PainPointsSection />`: Los 5 puntos de dolor del cliente en tarjetas editoriales blancas `rounded-[20px]`.
  - `<EcosystemSection />`: Diagrama de nodos interactivo unificando los 4 pilares bajo el núcleo de 77 Studio.
  - `<SolutionsGrid />`: Grid de las 4 capacidades principales con enrutamiento directo.
  - `<CasesSection />`: Casos de negocio y métricas validadas de impacto comercial.
  - `<ProcessSection />`: Metodología en 4 pasos (Entendemos → Proponemos → Creamos → Optimizamos).
  - `<ContactSection />` & `<ContactForm />`: Bloque de conversión con WhatsApp Business y formulario comercial.
- **Módulo 00 (Setup Core & Design Tokens)**: Configuración e inicialización de Astro 5.4+, Tailwind CSS v4 con Vite, TypeScript estricto, `@astrojs/mdx` y `@astrojs/vercel`.
- Creación de componentes estructurales base: `<Header />` con navbar flotante blanca y menú responsive, `<Footer />`, `<DualCTA />` con enlaces contextuales de WhatsApp, `<MobileStickyBar />` y `<BaseLayout />`.
- Definición de utilidades de diseño y conversión en `src/utils/whatsapp.ts`, `src/utils/seo.ts` y `src/utils/cn.ts`.
- Definición de la **Estrategia de Ramas de 3 Niveles (`feature/*` -> `develop` Staging -> `main` Producción)** con protocolo Human-in-the-loop y soporte para el comando `/goal`.
- Creación del comando `npm run 77 feature <nombre>` en la CLI para aislamiento automático de ramas y advertencia de protección en `main` y `develop`.
- Creación de la Skill dedicada `.agents/skills/77-commit-and-docs/SKILL.md` para automatizar commits y documentación técnica de propiedades.
- Creación de la CLI para Agentes `scripts/77-cli.mjs` accesible con `npm run 77 <comando>` (inspect, knowledge, generate, commit).
- Creación del Módulo 08: Integraciones de Marketing (`77/08-integraciones-marketing/index.mdx`) con soporte para Meta Pixel + CAPI serverless, Google Ads, GTM, GA4 y UTM Tracking.
- Creación del Módulo 09: Agente de IA Chat (`77/09-ia-agent-chat/index.mdx`) con especificación de `<AIChatWidget />`, endpoint serverless agnóstico `/api/chat.ts` y RAG mediante `public/knowledge.json`.
- Creación del Módulo 00 de Setup (`77/00-setup/index.mdx`) con requisitos de entorno, comandos de Astro 5, matriz de dependencias npm y matriz de 5 habilidades clave del desarrollador.
- Creación de la estructura modular de documentación en la carpeta `77/`.
- Definición de especificaciones MDX para las 7 vistas principales (`01-home` a `07-contacto`).
- Documento maestro de Gobernanza Técnica, Trunk-Based Development, Conventional Commits y despliegue continuo (`77/GOVERNANCE.md`).
- Integración de Vercel como entorno principal de vistas previas (Preview URLs) y producción.
- Protocolo para microservicios y backend en Dokploy.
- Flujo de trabajo para gestión de imprevistos, parches y updates mediante **GitHub Issues + GitHub Projects**.

---

## [0.1.0] - 2026-08-20

### Added
- Inicialización del Skill oficial `.agents/skills/77-design-system/SKILL.md`.
- Definición del Roadmap Maestro de Arquitectura y Desarrollo Astro MDX (`77/ROADMAP.md`).
- Definición del sistema de tokens visuales (Navbar flotante blanca, fuentes Sora + Inter Tight + IBM Plex Mono, tarjetas `rounded-[20px]`).
- Definición del esquema comercial de conversión dual CRO (WhatsApp + Formulario).
