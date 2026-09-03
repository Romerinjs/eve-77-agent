---
description: "Construir, validar y estandarizar archivos MDX de conocimiento para 77 Studio con Frontmatter YAML 100% tipado, taxonomía de slugs, palabras clave y estructura semántica optimizada para el motor de búsqueda en RAM del agente Eve."
---

# 77 Studio MDX Builder Skill

Esta habilidad define el estándar oficial para redactar y estructurar documentos `.mdx` dentro de `77/` y `content/knowledge/` para que el cerebro de inteligencia artificial de **77 Studio** (`eve-77-agent`) los indexe, entienda y cite con precisión absoluta y cero alucinaciones.

---

## 📋 Reglas de Oro del Formato MDX

Todo archivo `.mdx` debe cumplir con:

1. **Bloque Frontmatter YAML Obligatorio:** Debe iniciar exactamente en la línea 1 con `---` y cerrar con `---`.
2. **Esquema Zod Estricto (`FrontmatterSchema`):** Todos los campos requeridos deben estar presentes y con tipos válidos.
3. **Taxonomía de Slugs Estándar:** El slug debe seguir la convención `<categoría>/<nombre-en-kebab-case>`.
4. **Palabras Clave Semánticas (`keywords`):** Mínimo 8 y máximo 15 palabras clave en minúsculas sin acentos innecesarios que representen cómo buscaría un cliente potencial.
5. **Cero Contenido Truncado:** Texto estructurado en secciones con encabezados Markdown (`##`, `###`), viñetas y descripciones claras. El parser ignorará bloques JSX como `<ProfileCard />` y extraerá el texto semántico.

---

## 📐 Estructura del Frontmatter YAML

```yaml
---
title: "77 Studio - [Nombre del Módulo o Servicio]"
description: "[Resumen comercial de 1 a 2 oraciones que sintetice la propuesta de valor]"
module: "[XX-nombre-modulo, ej. 03-web, 10-esteban]"
route: "[Ruta URL en la web, ej. /web, /equipo/esteban]"
whatsappMessage: "Hola 77 Studio 👋 [Mensaje preconfigurado para contacto de WhatsApp]"
slug: "[categoria/nombre, ej. servicios/web, equipo/esteban]"
category: "[servicios | empresa | tecnologia | general | equipo | audiencias]"
audience: "[nuevos-clientes | empresas | fundadores-startups | todas]"
keywords:
  - palabra clave 1
  - palabra clave 2
  - palabra clave 3
  - paid media
  - desarrollo web
related_slugs:
  - "slug/relacionado-1"
  - "slug/relacionado-2"
---
```

---

## 🏷️ Taxonomía de Categorías Oficiales

| Categoría | Propósito | Ejemplos de Slugs | Audiencia Recomendada |
| :--- | :--- | :--- | :--- |
| `servicios` | Servicios comerciales principales (Web, Marketing, IA, SaaS). | `servicios/web`, `servicios/marketing`, `servicios/ia-automatizacion` | `empresas`, `nuevos-clientes` |
| `empresa` | Información institucional, equipo fundador, visión y contacto. | `empresa/nosotros`, `empresa/contacto` | `todas` |
| `equipo` | Perfiles de ingenieros, diseñadores y líderes de proyectos. | `equipo/esteban`, `equipo/nicolas` | `todas` |
| `tecnologia` | Stack técnico, arquitecturas (Astro, Next.js, Vercel). | `tecnologia/setup`, `tecnologia/ia-agent-chat` | `empresas`, `fundadores-startups` |
| `audiencias` | Playbooks de atención y diagnóstico comercial por perfil. | `audiencias/nuevos-clientes`, `audiencias/empresas` | `nuevos-clientes`, `empresas` |
| `general` | Landing Home, visión general y propuesta de valor unificada. | `general/home` | `todas` |

---

## 🛠️ Procedimiento para Crear un Nuevo MDX

1. **Definir el propósito:** ¿Es un servicio nuevo, un perfil del equipo, un caso de éxito o una integración?
2. **Asignar Slug y Categoría:** Selecciona la categoría correcta de la tabla anterior y genera el slug en kebab-case.
3. **Redactar Frontmatter:** Completa los 10 campos del frontmatter asegurándote de incluir el mensaje de WhatsApp adecuado.
4. **Escribir el Cuerpo Markdown:**
   - Sección de Introducción y propuesta de valor.
   - Capacidades o características clave con viñetas explicativas.
   - Tecnologías utilizadas y beneficios tangibles (ROI, velocidad, automatización).
   - Llamado a la acción claro hacia diagnóstico o WhatsApp.
5. **Validación Automática:**
   - Ejecuta `npm run test:knowledge` para validar que el nuevo MDX sea indexado en RAM con éxito.

---

## 📚 Plantillas Rápidas Disponibles

- **Plantilla de Servicio:** Consulta [`assets/templates/service.mdx`](file:///d:/Usuarios/ACER/Documentos/88/eve-77-agent/agent/skills/mdx-builder/assets/templates/service.mdx)
- **Plantilla de Perfil de Equipo:** Consulta [`assets/templates/team-member.mdx`](file:///d:/Usuarios/ACER/Documentos/88/eve-77-agent/agent/skills/mdx-builder/assets/templates/team-member.mdx)
