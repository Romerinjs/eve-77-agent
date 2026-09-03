# Guía: Sincronización Automática de MDX vía GitHub Actions

Esta guía explica cómo configurar una **GitHub Action** en el repositorio de tu **Página Web en Astro** para que cada vez que crees, edites o elimines un archivo `.mdx` en la web, se sincronice automáticamente con este repositorio (**`eve-77-agent`**) y mantenga el cerebro de IA siempre actualizado.

---

## 🏗️ Cómo Funciona el Flujo

```
 1. Haces 'git push' en el repo de tu Web (Astro) modificando archivos MDX.
                        │
                        ▼
 2. GitHub Actions detecta el cambio en la carpeta de contenido.
                        │
                        ▼
 3. La Action clona 'eve-77-agent', copia los MDX actualizados y corre 'npm run test:knowledge'.
                        │
                        ▼
 4. Si los tests pasan, hace 'git commit' y 'git push' automático a 'eve-77-agent'.
                        │
                        ▼
 5. ¡Tu agente de IA queda actualizado en segundos con el nuevo conocimiento!
```

---

## 📋 Paso 1: Crear un Token de Acceso en GitHub (Personal Access Token)

Para que el repositorio de la Web tenga permisos de escribir en el repositorio del agente:

1. En GitHub, ve a tu foto de perfil (arriba a la derecha) ➡️ **Settings**.
2. Al final del menú izquierdo, haz clic en **Developer Settings**.
3. Selecciona **Personal access tokens** ➡️ **Fine-grained tokens** (o *Tokens (classic)*).
4. Haz clic en **Generate new token**:
   - **Token name:** `SYNC_AGENT_KNOWLEDGE`
   - **Repository access:** Selecciona el repositorio `eve-77-agent` (o *All repositories*).
   - **Permissions:** 
     - `Contents`: **Read and Write** (Lectura y Escritura).
5. Copia el token generado (empieza por `github_pat_...` o `ghp_...`).

---

## 🔐 Paso 2: Guardar el Token como Secret en el Repo de la Web

1. Entra a tu repositorio de la **Web en Astro** en GitHub.
2. Ve a la pestaña **Settings** ➡️ **Secrets and variables** ➡️ **Actions**.
3. Haz clic en **New repository secret**:
   - **Name:** `AGENT_REPO_TOKEN`
   - **Secret:** *(Pega el token que copiaste en el Paso 1)*.
4. Haz clic en **Add secret**.

---

## ⚡ Paso 3: Crear el Archivo de la Action en el Repo de la Web

En tu repositorio de la **Web en Astro**, crea el siguiente archivo en la ruta:
`.github/workflows/sync-knowledge-to-agent.yml`

```yaml
name: Sincronizar Conocimiento MDX con eve-77-agent

on:
  push:
    branches:
      - main
    paths:
      - '77/**'

jobs:
  sync-knowledge:
    name: Sincronizar MDX a eve-77-agent
    runs-on: ubuntu-latest

    steps:
      - name: 1. Checkout del Repositorio Web
        uses: actions/checkout@v4
        with:
          path: web-repo

      - name: 2. Checkout del Repositorio eve-77-agent
        uses: actions/checkout@v4
        with:
          repository: ${{ github.repository_owner }}/eve-77-agent
          token: ${{ secrets.AGENT_REPO_TOKEN }}
          path: agent-repo

      - name: 3. Copiar archivos MDX actualizados
        run: |
          echo "Copiando carpeta 77/ desde la raíz hacia eve-77-agent..."
          mkdir -p agent-repo/77
          cp -R web-repo/77/* agent-repo/77/

      - name: 4. Configurar Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: 24

      - name: 5. Instalar dependencias y validar motor de conocimiento
        working-directory: agent-repo
        run: |
          npm ci
          npm run test:knowledge
          npm run typecheck

      - name: 6. Commit y Push a eve-77-agent
        working-directory: agent-repo
        run: |
          git config user.name "77-studio-bot"
          git config user.email "bot@77.studio"
          git add .
          
          # Verificar si hubo cambios reales antes de hacer commit
          if git diff --staged --quiet; then
            echo "No hay cambios nuevos en los MDX. Todo al día."
          else
            git commit -m "sync: actualizar base de conocimiento MDX desde web-repo [skip ci]"
            git push origin main
            echo "✅ Base de conocimiento sincronizada exitosamente con eve-77-agent."
          fi
```

---

## 🧪 Paso 4: Probar la Sincronización

1. En tu repositorio web, edita cualquier archivo MDX (por ejemplo, cambia una línea en `77/03-web/index.mdx` o crea `77/10-nuevo-servicio/index.mdx`).
2. Haz `git commit` y `git push` a la rama `main` de tu web.
3. Ve a la pestaña **Actions** en tu repositorio de GitHub:
   - Verás la ejecución del flujo `Sincronizar Conocimiento MDX con eve-77-agent`.
   - La acción validará que los MDX no rompan el parser ni los tests (`npm run test:knowledge`).
   - Si todo es correcto, verás un nuevo commit automático en este repositorio `eve-77-agent`.

---

## 🛡️ Beneficios de este Enfoque

1. **Cero Mantenimiento:** Tú solo trabajas en tu repositorio web como siempre; el agente se actualiza solo en segundo plano.
2. **Validación Automática:** Si cometes un error de sintaxis en el frontmatter de un `.mdx`, la Action te avisará antes de que afecte al agente en producción.
3. **Cero Duplicidad:** Mantienes tu arquitectura desacoplada y limpia.
