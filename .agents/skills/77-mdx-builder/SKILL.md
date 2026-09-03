---
name: 77-mdx-builder
description: "Construir, validar y estandarizar archivos MDX de conocimiento para 77 Studio con Frontmatter YAML 100% tipado, taxonomía de slugs, palabras clave y estructura semántica optimizada para el motor de búsqueda en RAM del agente Eve."
---

# 77 Studio MDX Builder Skill (Workspace Tooling)

Esta habilidad es la guía oficial de desarrollo para crear y editar archivos `.mdx` dentro del ecosistema de **77 Studio** (`77/` y `content/knowledge/`), asegurando que cumplan con los estándares de diseño web y sean perfectamente indexados por el motor de búsqueda en memoria RAM del agente de IA (`eve-77-agent`).

---

## 📋 Reglas de Oro del Formato MDX para 77 Studio

Todo archivo `.mdx` creado o modificado en este proyecto debe cumplir estrictamente con:

1. **Bloque Frontmatter YAML Obligatorio:**
   - Inicia en la **Línea 1** con `---` y cierra con `---`.
   - Sin espacios vacíos antes del primer delimitador.
2. **Esquema Zod Estricto (`FrontmatterSchema`):**
   - Debe incluir los 10 campos requeridos por el parser (`agent/lib/knowledge.ts`):
     - `title`: Título formal con marca (`"77 Studio - ..."`).
     - `description`: Resumen comercial de 1 a 2 oraciones.
     - `module`: Identificador de carpeta (`"XX-nombre"`, ej. `"03-web"`, `"10-esteban"`).
     - `route`: Ruta web en Astro (ej. `"/web"`, `"/equipo/esteban"`).
     - `whatsappMessage`: Texto predeterminado para el enlace de WhatsApp.
     - `slug`: Identificador único semántico (`"<categoria>/<kebab-case>"`).
     - `category`: Una de las categorías oficiales (`servicios`, `empresa`, `equipo`, `tecnologia`, `audiencias`, `general`).
     - `audience`: Segmento meta (`"nuevos-clientes"`, `"empresas"`, `"fundadores-startups"`, `"todas"`).
     - `keywords`: Array de 8 a 15 términos clave en minúsculas.
     - `related_slugs`: Array de slugs relacionados para cross-linking.
3. **Compatibilidad Dual (Astro Web + Motor AST del Agente):**
   - Puedes usar componentes JSX/TSX (`<ProfileCard />`, `<TechBadge />`, etc.) en la parte inferior del archivo.
   - El parser del agente utiliza `unified` + `remark-mdx` para extraer únicamente el texto semántico limpio, ignorando la sintaxis JSX.

---

## 📐 Estructura Estándar del Frontmatter YAML

```yaml
---
title: "77 Studio - [Nombre del Servicio o Perfil]"
description: "[Propuesta de valor o resumen en 1 o 2 oraciones]"
module: "[XX-nombre-modulo]"
route: "/[ruta-url]"
whatsappMessage: "Hola 77 Studio 👋 [Mensaje de WhatsApp para el usuario]"
slug: "[categoria/nombre-en-kebab-case]"
category: "[servicios | empresa | equipo | tecnologia | audiencias | general]"
audience: "[nuevos-clientes | empresas | fundadores-startups | todas]"
keywords:
  - termino clave 1
  - termino clave 2
  - termino clave 3
  - desarrollo web
  - 77 studio
related_slugs:
  - "categoria/slug-relacionado-1"
  - "categoria/slug-relacionado-2"
---
```

---

## 🏷️ Taxonomía de Categorías Oficiales

| Categoría | Propósito Principal | Convención de Slug | Audiencia Típica |
| :--- | :--- | :--- | :--- |
| `servicios` | Servicios comerciales (Web, Marketing, IA, SaaS). | `servicios/<nombre>` | `empresas`, `nuevos-clientes` |
| `empresa` | Información corporativa, historia, contacto y visión. | `empresa/<nombre>` | `todas` |
| `equipo` | Perfiles de desarrolladores, diseñadores y líderes. | `equipo/<nombre>` | `todas` |
| `tecnologia` | Stack técnico, arquitecturas y guías de desarrollo. | `tecnologia/<nombre>` | `empresas`, `fundadores-startups` |
| `audiencias` | Playbooks comerciales por segmento de cliente. | `audiencias/<nombre>` | `nuevos-clientes`, `empresas` |
| `general` | Home y propuesta de valor unificada. | `general/home` | `todas` |

---

## 🚀 Flujo de Trabajo para Crear un Nuevo MDX

1. **Ubicación:** Crear la carpeta del módulo bajo `77/XX-nombre/` con un archivo `index.mdx` (o `nombre.mdx`).
2. **Aplicar Plantilla:** Selecciona la plantilla adecuada desde `assets/templates/`:
   - Para Servicios: `assets/templates/service.mdx`
   - Para Miembros de Equipo: `assets/templates/team-member.mdx`
3. **Completar Frontmatter:** Rellena todos los campos con datos reales y keywords optimizadas.
4. **Redactar Cuerpo MDX:** Estructura el contenido con encabezados claros (`#`, `##`), viñetas explicativas y componentes de Astro si aplica.
5. **Validación Inmediata:**
   Ejecuta el test del motor de conocimiento para certificar que el archivo sea indexado en RAM:
   ```powershell
   npm run test:knowledge
   ```
