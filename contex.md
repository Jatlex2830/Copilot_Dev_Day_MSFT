# 🎮 Prompt para GitHub Copilot — Mona Mayhem Battle Arena
## Contexto

Estoy trabajando en el repo `ItielSanzAXO/my-mona-mayhem`, que es un workshop de GitHub Copilot Dev Days. Es una app Astro con Node.js que compara gráficas de contribuciones de GitHub entre dos usuarios.

Quiero agregar una funcionalidad de **torneo eliminatorio 1v1** para usar durante el evento. Los participantes del workshop van a registrarse abriendo un Pull Request que agrega **su propio archivo JSON** dentro de la carpeta `participants/`. Necesito que hagas todos los cambios respetando la estructura existente del proyecto (Astro + TypeScript + Node adapter).

---

## Parte 1 — Estructura de participantes (sin conflictos de merge)

**Crea la carpeta `participants/` en la raíz del proyecto** con los siguientes archivos de ejemplo:

### `participants/octocat.json`
```json
{
  "username": "octocat",
  "displayName": "The Octocat",
  "funFact": "Soy la mascota oficial de GitHub desde 2011."
}
```

### `participants/monalisa.json`
```json
{
  "username": "monalisa",
  "displayName": "Mona Lisa",
  "funFact": "Mi nombre viene de la Mona Lisa de Da Vinci."
}
```

### `participants/README.md`
Crea un README en esa carpeta explicando a los participantes cómo agregar su propio archivo. Debe decir:

- Crear un archivo llamado exactamente `<tu-username-de-github>.json`
- El archivo debe tener los campos `username`, `displayName` y `funFact`
- Abrir un PR con **solo ese archivo** — no modificar nada más
- Por qué se usa un archivo por persona: para evitar conflictos de merge cuando varios participantes mandan su PR al mismo tiempo

---

## Parte 2 — API endpoint para leer participantes

**Crea un nuevo API endpoint en Astro**: `src/pages/api/participants.ts`

Este endpoint debe:
1. Leer todos los archivos `.json` dentro de la carpeta `participants/` en la raíz del proyecto
2. Parsear cada archivo y devolver un array con todos los participantes
3. Validar que cada archivo tenga los campos `username`, `displayName` y `funFact` — si le falta alguno, omitirlo con un `console.warn`
4. Devolver el array como JSON con el header `Content-Type: application/json`
5. Manejar errores: si la carpeta no existe o está vacía, devolver un array vacío `[]`

Usa `fs` de Node.js y `path` para leer los archivos. El endpoint debe funcionar con el adaptador `@astrojs/node` que ya está configurado en el proyecto.

---

## Parte 3 — Página del torneo

**Crea una nueva página**: `src/pages/tournament.astro`

Esta página debe ser una **Single Page Application** usando JavaScript vanilla (no frameworks adicionales) con tres vistas que se muestran/ocultan dinámicamente:

### Vista 1: Setup
- Muestra la lista de participantes cargada desde `/api/participants`
- Para cada participante muestra: avatar de GitHub (`github.com/<username>.png`), displayName, username y funFact
- Botón "Iniciar Torneo" que solo se activa si hay 2 o más participantes
- Mensaje indicando cuántos jugadores se detectaron y el tamaño del bracket (2, 4, 8 o 16)

### Vista 2: Bracket
- Bracket de torneo eliminatorio visual, estilo arcade
- Soportar 2, 4, 8 o 16 jugadores (rellenar con "BYE" si el número no es potencia de 2)
- Los BYEs avanzan automáticamente sin necesitar duelo
- Los jugadores se asignan al bracket en orden aleatorio (shuffle al inicio)
- Cada match card muestra los dos jugadores y, cuando esté resuelto, al ganador marcado con 👑
- El match activo (el siguiente a jugar) debe destacarse visualmente
- Click en un match pendiente para ir al duelo

### Vista 3: Duelo 1v1
- Muestra los avatares de ambos jugadores en grande
- Llama al endpoint existente de contribuciones de GitHub que ya usa el proyecto para obtener el conteo del último año de cada jugador
- Mientras carga: mostrar animación de "cargando"
- Cuando carga: animar barras de HP proporcionales a las contribuciones de cada jugador
- El jugador con más contribuciones gana
- Mostrar banner con el ganador, su score y el score del perdedor
- Botones: "Ver bracket" y "Siguiente duelo"
- Al terminar el torneo: pantalla de campeón con el ganador final

### Estética
Usa la fuente `Press Start 2P` que ya está disponible en el proyecto. Respeta el color scheme existente de la app (variables CSS del proyecto). Fondo oscuro, estilo arcade retro. Agrega scanlines con CSS (`:after` en body con `repeating-linear-gradient`).

---

## Parte 4 — Enlace en la navegación

Modifica el layout o componente de navegación existente para agregar un link a `/tournament` con el texto "🏆 Torneo". Respeta el estilo de navegación que ya existe en el proyecto.

---

## Parte 5 — GitHub Action para auto-merge de PRs válidos

**Crea el archivo** `.github/workflows/auto-merge-participant.yml`

Este workflow debe:

1. **Dispararse** en el evento `pull_request` con tipos `opened` y `synchronize`

2. **Job: `validate-and-merge`** con los siguientes steps:

   **Step 1 — Detectar archivos cambiados**
   Usar `git diff` para obtener la lista de archivos modificados en el PR comparando con `main`. Guardar la lista en una variable de output.

   **Step 2 — Validar que el PR solo toca UN archivo en `participants/`**
   - Verificar que el número de archivos cambiados sea exactamente 1
   - Verificar que ese archivo esté dentro de la carpeta `participants/`
   - Verificar que la extensión sea `.json`
   - Verificar que el nombre del archivo (sin `.json`) coincida con el campo `username` dentro del JSON
   - Si cualquier validación falla: agregar un **comentario al PR** explicando qué falló y terminar el job sin hacer merge (exit 0, no fallar el workflow)

   **Step 3 — Validar el contenido del JSON**
   - Parsear el JSON del archivo agregado
   - Verificar que existan los campos `username`, `displayName` y `funFact`
   - Verificar que ningún campo esté vacío
   - Verificar que `username` sea un string sin espacios
   - Si falla: comentar en el PR con el error específico

   **Step 4 — Verificar que el username de GitHub existe**
   - Hacer un `curl` a `https://api.github.com/users/<username>` y verificar que responde 200
   - Si el usuario no existe en GitHub: comentar en el PR

   **Step 5 — Auto-merge si todo pasó**
   - Usar `gh pr merge --squash --auto` para hacer merge automático
   - Agregar un comentario de bienvenida al PR: "✅ ¡Bienvenido al torneo, @username! Tu perfil fue agregado automáticamente."

   **Permisos necesarios** en el workflow:
   ```yaml
   permissions:
     contents: write
     pull-requests: write
   ```

   **Variables de entorno**: usar `GITHUB_TOKEN` del contexto de secrets para los comandos de `gh`.

---

## Parte 6 — Instrucciones para el participante (PR template)

**Crea el archivo** `.github/pull_request_template.md`

El template debe tener este contenido:

```markdown
## 🎮 Registro al Torneo — Mona Mayhem Battle Arena

### Checklist antes de enviar tu PR

- [ ] Mi archivo se llama exactamente `participants/<mi-username-github>.json`
- [ ] El campo `username` en el JSON coincide exactamente con mi username de GitHub
- [ ] Llené el campo `displayName` con el nombre que quiero mostrar en pantalla
- [ ] Escribí algo en `funFact` (¡puede ser lo que quieras!)
- [ ] Este PR solo modifica UN archivo (el mío en `participants/`)

### Mi archivo

<!-- El bot revisará automáticamente tu PR. Si hay algún error te lo dirá en un comentario. -->
```

---

## Resumen de archivos a crear/modificar

| Acción | Archivo |
|--------|---------|
| Crear | `participants/octocat.json` |
| Crear | `participants/monalisa.json` |
| Crear | `participants/README.md` |
| Crear | `src/pages/api/participants.ts` |
| Crear | `src/pages/tournament.astro` |
| Modificar | componente/layout de navegación existente |
| Crear | `.github/workflows/auto-merge-participant.yml` |
| Crear | `.github/pull_request_template.md` |

---

## Notas importantes para Copilot

- No rompas ninguna funcionalidad existente del proyecto
- Usa TypeScript donde el proyecto ya usa TypeScript
- Respeta el adaptador `@astrojs/node` — el proyecto corre en modo `server` (SSR), no estático
- La carpeta `participants/` debe leerse en runtime (SSR), no en build time, porque los PRs se aprueban durante el evento y la app está corriendo
- Si el proyecto tiene un archivo de estilos globales o variables CSS, úsalos en la página del torneo
- Revisa el archivo `astro.config.mjs` antes de crear el endpoint para confirmar la configuración del output mode