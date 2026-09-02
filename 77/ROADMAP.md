# 77 STUDIO - Roadmap Maestro de Arquitectura & Desarrollo Web Astro MDX

> **Visión del Proyecto:** Digital Studio + Creative Partner + Technology & AI Company.
> **Propósito:** Guía de implementación técnica y conceptual para la creación del sitio web oficial de 77 Studio utilizando **Astro**, **Astro MDX**, **Tailwind CSS** y las directrices visuales y comerciales definidas en el skill `.agents/skills/77-design-system/SKILL.md`.

---

## 1. Arquitectura General y Stack Tecnológico

- **Framework**: Astro 5.x (Islands Architecture para rendimiento extremo).
- **Integración de Contenidos**: Astro MDX (`@astrojs/mdx`) para gestionar el contenido comercial de cada vista con componentes interactivos inyectados.
- **Estilos & Diseño**: Tailwind CSS v4 / Vanilla CSS con design tokens de `index.html` (Navbar flotante blanca, fondo gris claro, cards redondeadas `rounded-[20px]`, acento violeta `#7C3AED`, fuentes Sora + Inter Tight + IBM Plex Mono).
- **Optimización Comercial (CRO)**:
  - Doble CTA en paralelo (WhatsApp prellenado + Formulario/Email).
  - Selector de idioma ES / EN con mapeo directo de rutas.
  - Tracking automático de origen en formularios.
  - Barra inferior sticky en móviles con botón directo a WhatsApp y Contacto.

---

## 2. Estructura del Proyecto en la Carpeta `77/`

La carpeta `77/` organiza la documentación y especificaciones modulares por subcarpetas para cada vista principal del sitio web:

```
77/
├── ROADMAP.md                      # Documentación y roadmap principal del sitio
├── GOVERNANCE.md                   # Gobernanza técnica, Git workflow, Vercel CI/CD y SemVer
├── CHANGELOG.md                    # Historial de cambios y lanzamientos (Keep a Changelog)
├── 00-setup/
│   └── index.mdx                   # Setup de entorno Astro 5, stack, librerías y matriz de habilidades
├── 01-home/
│   └── index.mdx                   # Especificación modular y layout MDX de Home
├── 02-marketing/
│   └── index.mdx                   # Especificación modular y layout MDX de Marketing
├── 03-web/
│   └── index.mdx                   # Especificación modular y layout MDX de Web
├── 04-ia-automatizacion/
│   └── index.mdx                   # Especificación modular y layout MDX de IA + Automatización
├── 05-productos-digitales/
│   └── index.mdx                   # Especificación modular y layout MDX de Productos Digitales
├── 06-nosotros/
│   └── index.mdx                   # Especificación modular y layout MDX de Acerca de Nosotros
├── 07-contacto/
│   └── index.mdx                   # Especificación modular y layout MDX de Contacto
├── 08-integraciones-marketing/
│   └── index.mdx                   # Meta CAPI, Google Ads, GTM, GA4 y UTM Tracking
└── 09-ia-agent-chat/
    └── index.mdx                   # Widget AIChatWidget, /api/chat.ts y RAG con public/knowledge.json
```

---

## 3. Matriz de Módulos y Rutas del Sitio Web

| Módulo | Subcarpeta | Ruta Astro | Objetivo Comercial | CTA Primario WhatsApp |
|---|---|---|---|---|
| **00 | Setup & Stack** | `77/00-setup/` | N/A | Especificación del entorno Astro 5, dependencias npm, config y matriz de habilidades. | N/A |
| **01 | Home** | `77/01-home/` | `/` | Explicar en <5s qué hace la empresa; vender ecosistema completo. | `"Hola 77 Studio 👋 Vi su página web y quisiera conversar sobre un proyecto para mi empresa."` |
| **02 | Marketing** | `77/02-marketing/` | `/marketing` | Demostrar cómo Meta Ads + Google Ads + Creatividad generan leads. | `"Hola 77 Studio 👋 Vi sus servicios de marketing y quisiera conocer cómo pueden ayudar..."` |
| **03 | Web** | `77/03-web/` | `/web` | Vender sitios y landings como máquinas de conversión y confianza. | `"Hola 77 Studio 👋 Estoy interesado en desarrollar o mejorar la página web de mi empresa."` |
| **04 | IA + Auto** | `77/04-ia-automatizacion/` | `/ia-automatizacion` | Mostrar automatización de procesos internos y CRM sin humo tecnológico. | `"Hola 77 Studio 👋 Quiero explorar oportunidades para implementar IA o automatización..."` |
| **05 | Prod. Digitales** | `77/05-productos-digitales/` | `/productos-digitales` | Posicionar capacidad de crear SaaS, MVP, portales y dashboards. | `"Hola 77 Studio 👋 Tengo una idea para una herramienta o producto digital..."` |
| **06 | Nosotros** | `77/06-nosotros/` | `/nosotros` | Generar confianza, mostrar equipo real y operación CO ↔ USA. | `"Hola 77 Studio 👋 Vi su historia y equipo y quisiera conversar sobre un proyecto."` |
| **07 | Contacto** | `77/07-contacto/` | `/contacto` | Capturar conversaciones de alta intención por WhatsApp o Formulario. | `"Hola 77 Studio 👋 Quiero conversar con ustedes sobre un proyecto para mi empresa."` |
| **08 | Marketing Infra** | `77/08-integraciones-marketing/` | `/api/events/*` | Tracking Meta CAPI, Google Ads, GTM, GA4 y UTM Tracking en la conversión dual. | N/A |
| **09 | IA Agent & Chat** | `77/09-ia-agent-chat/` | `/api/chat` | Asistente inteligente RAG consultor de servicios con `public/knowledge.json`. | N/A |

---

## 4. Catálogo de Componentes Astro & MDX

1. `<Header />`: Navbar blanca flotante redondeada (`fixed top-5 left-1/2 -translate-x-1/2`), mega-menú interactivo, selector ES/EN y botón "Hablemos".
2. `<HeroSection />`: Encabezado principal con tipografía Sora, subencabezado Inter Tight, composición visual/video real y bloque de CTAs duales.
3. `<DualCTA />`: Módulo reutilizable de conversión comercial con WhatsApp prellenado + botón de correo/formulario.
4. `<CapabilityGrid />`: Grid de tarjetas blancas (`rounded-[20px]`) con hover interactivo y microanimaciones.
5. `<CaseGrid />`: Presentación de portfolio con casos de negocio reales (Reto → Solución → Resultado validado).
6. `<WorkflowDiagram />`: Diagrama de nodos visual para automatización e IA (Lead → CRM → IA → Equipo humano).
7. `<ContactForm />`: Formulario limpio con campos de nombre, empresa, email, teléfono, país, selector de servicios y campo oculto de origen.
8. `<MobileStickyBar />`: Barra inferior fija en teléfonos móviles con acceso directo instantáneo a WhatsApp y formulario.
9. `<Footer />`: Pie de página limpio con enlaces institucionales, sedes Colombia + Estados Unidos y copyright.

---

## 5. Fases de Ejecución

### Fase 0: Setup de Entorno, Stack & Librerías (Completado)
- Creación de `77/00-setup/index.mdx` (especificación de Node v20+, Astro 5.x, dependencias npm y matriz de 5 habilidades clave).

### Fase 1: Creación del Skill & Estructura Base (Completado)
- Definición del skill `.agents/skills/77-design-system/SKILL.md`.
- Creación de la carpeta `77/` y el archivo maestro `ROADMAP.md`.

### Fase 2: Gobernanza Técnica & Control de Versiones (Completado)
- Creación de `77/GOVERNANCE.md` (Trunk-Based Development, GitHub Issues, Vercel CI/CD, SemVer 2.0.0, Dokploy).
- Inicialización de `77/CHANGELOG.md` para trazabilidad de cambios.

### Fase 3: Documentación de Vistas por Módulos (En progreso)
- Generación de las especificaciones MDX en cada subcarpeta (`01-home` a `07-contacto`).

### Fase 4: Construcción de Componentes Astro
- Creación de componentes UI en `src/components/` siguiendo los tokens CSS de `index.html`.

### Fase 5: Ensamble de Páginas & Integración MDX
- Creación de las páginas en `src/pages/` y renderizado de colecciones MDX.

### Fase 6: QA, CRO & Despliegue Continuo en Vercel
- Pruebas en dispositivos móviles, auditoría de velocidad, verificación de links prellenados de WhatsApp, Preview URLs de Vercel y Tagging `v1.0.0` en GitHub.

---

## 6. Gobernanza Técnica y Protocolo de Cambios

Para detalles exhaustivos sobre la gestión del proyecto, consulta [GOVERNANCE.md](file:///d:/romer/REN/proyectos/web%2077%20studio/77/GOVERNANCE.md):
1. **Control de Versiones:** Trunk-Based Development (`main` para producción + ramas de feature/fix).
2. **Commits:** Convención de mensajes **Conventional Commits** (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `chore:`).
3. **CI/CD:** Despliegue automático en Vercel con vistas previas interactivas en cada PR. Microservicios orquestados en Dokploy.
4. **Gestión de Imprevistos & Updates:** GitHub Issues + GitHub Projects para auditar cambios de alcance o parches.
5. **Versionado Semántico:** SemVer 2.0.0 (`MAJOR.MINOR.PATCH`) vinculados a `77/CHANGELOG.md`.

