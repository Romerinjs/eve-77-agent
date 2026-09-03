# Guía de Adaptación: UI del Chat Web para Sofía (Asesora Comercial de 77 Studio)

Esta guía documenta los cambios visuales, textos y componentes necesarios para actualizar el widget de chat en la **Página Web en Astro** (`web-77-studio`), alineando la interfaz con la identidad comercial de **Sofía**.

---

## 🎨 1. Comparativa Visual (Antes vs. Después)

| Elemento de UI | Versión Anterior (Eve AI) | Nueva Versión Oficial (Sofía) |
| :--- | :--- | :--- |
| **Subtítulo del Header** | `• Eve AI Conectado` | `• Sofía Conectada` *(con punto verde pulsante)* |
| **Título del Header** | `77 Studio ✓` | `77 Studio ✓` |
| **Avatar / Badge** | Logo 77 púrpura + badge | Logo 77 púrpura + badge verde |
| **Mensaje de Bienvenida** | *"¡Hola! 👋 Soy Eve, el agente de inteligencia artificial..."* | *"¡Hola! 👋 Soy **Sofía**, asesora comercial de **77 Studio**..."* |
| **Placeholder del Input** | `"Escribe tu consulta o duda..."` | `"Escribe tu consulta para Sofía..."` |

---

## 💬 2. Mensaje de Bienvenida Oficial

```markdown
¡Hola! 👋 Soy **Sofía**, asesora comercial de **77 Studio**.

Puedo orientarte en tiempo real sobre cómo impulsar tu empresa con **Marketing, Desarrollo Web, Automatización con IA y Productos Digitales**, o coordinar una llamada de diagnóstico con nuestro equipo.

¿En qué te puedo ayudar hoy?
```

---

## 🔘 3. Preguntas Frecuentes Sugeridas (Quick-Action Pills)

Reemplaza las 4 preguntas de acceso rápido por estas opciones optimizadas para calificación y conversión comercial:

```typescript
export const QUICK_QUESTIONS = [
  {
    icon: "🚀",
    text: "¿Qué servicios ofrece 77 Studio?",
    query: "¿Cuáles son los 4 servicios principales que ofrece 77 Studio?",
  },
  {
    icon: "💼",
    text: "¿Cómo me ayudan a conseguir más clientes?",
    query: "¿Cómo me ayudan a captar clientes con Meta Ads y Google Ads?",
  },
  {
    icon: "⚡",
    text: "¿Cómo automatizan WhatsApp y CRM con IA?",
    query: "¿Cómo funciona la automatización comercial y agentes IA para WhatsApp y CRM?",
  },
  {
    icon: "💬",
    text: "¿Cómo agendar una llamada de diagnóstico?",
    query: "¿Cómo puedo agendar una llamada de diagnóstico con el equipo de 77 Studio?",
  },
];
```

---

## 💻 4. Snippet de Implementación para Astro / React

Si tu componente está en `src/components/chat/ChatWidget.astro` o `WebChat.tsx`, actualiza el bloque del encabezado y bienvenida con la siguiente estructura:

### Header del Widget:
```tsx
<!-- Header -->
<div class="flex items-center justify-between px-5 py-4 border-b border-stroke-2/60 bg-white rounded-t-[24px]">
  <div class="flex items-center gap-3">
    <div class="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-opai-purple to-violet-600 flex items-center justify-center text-white font-sora font-bold text-lg shadow-sm">
      77
      <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
    </div>
    <div>
      <div class="flex items-center gap-1.5 font-sora font-semibold text-background-13 text-sm">
        77 Studio
        <svg class="w-4 h-4 text-opai-purple fill-current" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
      </div>
      <div class="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Sofía Conectada
      </div>
    </div>
  </div>

  <button 
    id="close-chat" 
    class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
    aria-label="Minimizar chat"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
    </svg>
  </button>
</div>
```

---

## 📱 5. Enlaces de WhatsApp Directo en la Interfaz

Para que el frontend soporte los dos mercados atendidos por 77 Studio:

* **Canal Colombia / Latam:** `https://wa.me/573148490955`
* **Canal USA / Internacional:** `https://wa.me/12029337792`

---

## ✅ 6. Checklist de Validación en la Web

- [ ] Subtítulo en el header actualizado a `• Sofía Conectada`.
- [ ] Mensaje inicial de bienvenida actualizado con la voz de Sofía.
- [ ] 4 Quick FAQs actualizadas con íconos y textos comerciales.
- [ ] Input con placeholder `"Escribe tu consulta para Sofía..."`.
- [ ] Pruebas de respuesta en tiempo real conectando a `/eve/v1/web`.
