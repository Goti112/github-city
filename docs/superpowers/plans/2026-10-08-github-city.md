# GitHub City — Plan de implementación (v1)

> **Para agentes:** SUB-SKILL REQUERIDA: usa superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para ejecutar este plan tarea a tarea. Los pasos usan checkboxes (`- [ ]`) para el seguimiento.
>
> **👤 Paso manual** = lo hace Miquel, no el agente. El agente se detiene y espera confirmación.

**Goal:** Web pública donde escribes un usuario de GitHub y se genera una ciudad 3D con sus repos como edificios.

**Architecture:** SPA Vite + React + TS con React Three Fiber. Una función serverless de Vercel (`api/city/[user].ts`) hace una única consulta GraphQL a GitHub y devuelve un JSON cacheado. La lógica (transformación de la respuesta y layout de la ciudad) son funciones puras testeadas con Vitest; la escena solo pinta lo que devuelve `cityLayout`.

**Tech Stack:** Vite, React 18, TypeScript, three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, react-router-dom, Vitest, Vercel (Hobby), `vercel` CLI para desarrollo local.

**Spec:** `docs/superpowers/specs/2026-10-08-github-city-design.md` (leer antes de empezar).

## Global Constraints

- Coste 0 €: solo plan Hobby de Vercel y token gratuito de GitHub.
- El token vive solo en la variable de entorno `GITHUB_TOKEN` (servidor). Nunca en el front ni en el repo; `.env*` en `.gitignore`.
- Usuario válido: `^[a-zA-Z0-9-]{1,39}$`.
- Máximo 100 repos públicos propios, sin forks, archivados incluidos, ordenados por último push.
- Caché: `Cache-Control: s-maxage=3600, stale-while-revalidate=86400`.
- Códigos de error de la API: `INVALID_USERNAME` (400), `USER_NOT_FOUND` (404), `RATE_LIMITED` (429), `UPSTREAM_ERROR` (502).
- Rutas: `/` (Home) y `/ciudad/:user`.
- Marca de agua de la captura: `github-city · miquelmanzano.com`.
- Objetivo de rendimiento: ~60 fps con 100 repos en portátil medio.

## Review Focus

1. **Nombres con mayúsculas o espacios alrededor** (`" Torvalds "`) → se recortan y la ciudad carga igual. Test en Task 2 (`isValidUsername` recibe ya `trim()`) y en Task 11 (el buscador recorta).
2. **Repo sin commits / rama por defecto vacía** (`defaultBranchRef: null`) → `commits: 0`, edificio de altura mínima, sin crash. Test en Task 2.
3. **Todos los repos sin lenguaje** → un único barrio "Otros" en gris. Test en Task 3.
4. **Fecha de último push en el futuro** (relojes desincronizados) → `litRatio` 1, nunca > 1. Test en Task 3.
5. **Usuario que es una organización** → GitHub devuelve `user: null`; se muestra la 404 ("usuario no encontrado"), no un error genérico. Test en Task 2.

## Estructura de archivos

```
api/city/[user].ts            handler serverless (fino: valida, llama a GitHub, mapea errores)
src/lib/types.ts              tipos compartidos (CityResponse, Repo, Building, ApiErrorCode)
src/lib/github.ts             CITY_QUERY, isValidUsername, transformGithubResponse, errorFromGithub
src/lib/github.test.ts
src/lib/fixtures/github-response.json
src/lib/cityLayout.ts         buildingHeight, plotSize, litRatio, cityLayout
src/lib/cityLayout.test.ts
src/lib/api.ts                fetchCity (cliente) + CityError
src/lib/api.test.ts
src/scene/CityScene.tsx       Canvas, luces, cámara, postprocesado
src/scene/Buildings.tsx       InstancedMesh de edificios + hover/clic
src/scene/windowsMaterial.ts  material con ventanas (shader) y litRatio
src/scene/Ground.tsx          suelo, calles, plaza con avatar
src/scene/Sky.tsx             cielo + interpolación día/noche
src/scene/timeOfDay.ts        interpolación de colores/intensidades (pura, testeada)
src/scene/timeOfDay.test.ts
src/ui/SearchBar.tsx  UserCard.tsx  Toolbar.tsx  RepoPanel.tsx  Tooltip.tsx  StatusScreen.tsx
src/ui/screenshot.ts          captura del canvas + marca de agua
src/pages/Home.tsx  CityPage.tsx  NotFound.tsx
src/App.tsx  main.tsx  styles.css
index.html                    meta Open Graph
public/og.png                 imagen OG genérica
vercel.json                   rewrite SPA
```

---

## Día 1 — Proyecto y API

### Task 1: Scaffolding del proyecto

**Files:** Create: todo el esqueleto Vite, `vercel.json`, `.gitignore`, `.env.example`

- [x] **Step 1:** `npm create vite@latest . -- --template react-ts` en la raíz del repo (ya existe `docs/`; conservarlo).
- [x] **Step 2:** `npm i three @react-three/fiber @react-three/drei @react-three/postprocessing react-router-dom` y `npm i -D vitest @types/three @vercel/node vercel`.
- [x] **Step 3:** Añadir script `"test": "vitest run"`. Crear `.env.example` con `GITHUB_TOKEN=` y asegurar `.env*` (salvo `.env.example`) en `.gitignore`.
- [x] **Step 4:** `vercel.json`: `{ "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }] }`.
- [x] **Step 5:** Verificar: `npm run build` sin errores y `npm test` (sin tests aún: "No test files found" es aceptable; añadir `passWithNoTests: true` en la config de Vitest).
- [x] **Step 6:** Commit `chore: scaffolding Vite + R3F + Vitest`.

- [x] **👤 Paso manual:** Crear un *fine-grained personal access token* en GitHub (Settings → Developer settings), solo acceso de lectura a repos públicos, y guardarlo en `.env` (no `.env.local`: `vercel dev` no lo lee) como `GITHUB_TOKEN=...`. No pegarlo en el chat.

### Task 2: Transformador de GitHub (TDD)

**Files:** Create `src/lib/types.ts`, `src/lib/github.ts`, `src/lib/github.test.ts`, `src/lib/fixtures/github-response.json`

**Interfaces — Produces:**
```ts
// types.ts
export type Repo = { name: string; description: string | null; url: string; stars: number;
  language: string | null; languageColor: string | null; commits: number; lastPush: string };
export type CityResponse = { user: { login: string; name: string | null; avatarUrl: string };
  repos: Repo[]; activity: { totalContributions: number; last30Days: number } };
export type ApiErrorCode = 'INVALID_USERNAME' | 'USER_NOT_FOUND' | 'RATE_LIMITED' | 'UPSTREAM_ERROR';
export type Building = { repoName: string; x: number; z: number; width: number; depth: number;
  height: number; color: string; litRatio: number; district: string };

// github.ts
export const CITY_QUERY: string;
export function isValidUsername(s: string): boolean;
export function transformGithubResponse(json: unknown, now: Date): CityResponse; // lanza Error('USER_NOT_FOUND') si data.user es null
export function errorFromGithub(status: number, json: unknown): ApiErrorCode;
```

`CITY_QUERY` (variable `$login`): `user(login:$login){ login name avatarUrl contributionsCollection{ contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount }}}} repositories(first:100, ownerAffiliations:OWNER, isFork:false, privacy:PUBLIC, orderBy:{field:PUSHED_AT, direction:DESC}){ nodes{ name description url stargazerCount pushedAt primaryLanguage{ name color } defaultBranchRef{ target{ ... on Commit { history{ totalCount }}}}}}}`.

- [x] **Step 1: Fixture.** `github-response.json` con forma `{ data: { user: {...} } }`: 3 repos — uno TypeScript con 120 commits y 5 estrellas, uno Java sin estrellas, uno con `primaryLanguage: null` y `defaultBranchRef: null`. Calendario con días dentro y fuera de los últimos 30 días respecto a `now = 2026-10-08T00:00:00Z`.
- [x] **Step 2: Tests que fallan** en `github.test.ts`:
  - `isValidUsername`: `true` para `"miquel-manzano"`, `"a"`, 39 caracteres; `false` para `""`, 40 caracteres, `"a b"`, `"a_b"`, `"../x"`.
  - `transformGithubResponse(fixture, now)`: devuelve 3 repos con `stars`, `commits`, `language`, `languageColor`, `lastPush` mapeados; el repo con `defaultBranchRef: null` tiene `commits === 0` y `language === null`; `activity.totalContributions` igual al del calendario; `activity.last30Days` = suma de días con `date` > `now - 30 días`.
  - `{ data: { user: null } }` → lanza con mensaje `USER_NOT_FOUND` (cubre organizaciones).
  - `errorFromGithub`: `403` o `429` → `RATE_LIMITED`; `500` → `UPSTREAM_ERROR`; `200` con `errors[0].type === 'NOT_FOUND'` → `USER_NOT_FOUND`.
- [x] **Step 3:** `npm test` → FAIL (funciones no definidas).
- [x] **Step 4:** Implementar `types.ts` y `github.ts`.
- [x] **Step 5:** `npm test` → PASS.
- [x] **Step 6:** Commit `feat: transformador de respuesta de GitHub`.

### Task 2b: Handler serverless

**Files:** Create `api/city/[user].ts`

**Interfaces — Consumes:** `CITY_QUERY`, `isValidUsername`, `transformGithubResponse`, `errorFromGithub` (Task 2). **Produces:** `GET /api/city/:user` → `200 CityResponse` | `{ error: ApiErrorCode }` con los status de Global Constraints.

- [x] **Step 1:** Handler `@vercel/node`: `user = String(req.query.user).trim()`; si `!isValidUsername` → 400. `POST https://api.github.com/graphql` con `Authorization: bearer ${process.env.GITHUB_TOKEN}` y `User-Agent: github-city`. Si `!res.ok` o `json.errors` → `errorFromGithub`. Si no, `transformGithubResponse(json, new Date())`; capturar `USER_NOT_FOUND` → 404; cualquier otra excepción → 502. Respuesta 200 con la cabecera `Cache-Control` de Global Constraints; errores 404 con `s-maxage=300`; 429/502 sin caché.
- [x] **Step 2: Verificar** con `npx vercel dev` (primera vez pide login/enlace del proyecto → **👤 Paso manual**):
  - `curl localhost:3000/api/city/torvalds` → 200 con repos.
  - `curl localhost:3000/api/city/esteusuarionoexiste-xyz123` → 404 `USER_NOT_FOUND`.
  - `curl "localhost:3000/api/city/a_b"` → 400.
- [x] **Step 3:** Commit `feat: endpoint /api/city/:user`.

✅ **Fin del día 1:** la API devuelve tus datos reales en local.

---

## Día 2 — Lógica de la ciudad

### Task 3: `cityLayout` (TDD)

**Files:** Create `src/lib/cityLayout.ts`, `src/lib/cityLayout.test.ts`

**Interfaces — Produces:**
```ts
export const CELL = 3;                       // parcela máx. 2 + calle 1
export function buildingHeight(commits: number): number;   // 1 + log2(commits + 1) * 1.5
export function plotSize(stars: number): number;           // 0 → 1, 1–9 → 1.5, ≥10 → 2
export function litRatio(lastPush: string, now: Date): number; // ≤30 d → 1; lineal hasta 0.05 a 365 d; luego 0.05; futuro → 1
export function desaturate(hex: string): string;           // reduce saturación ~35 %, devuelve '#rrggbb'
export const OTHER_DISTRICT = 'Otros';
export const NEUTRAL_COLOR = '#8a8f98';
export function cityLayout(repos: Repo[], now: Date): Building[];
```

**Algoritmo de `cityLayout`** (no lo determinan los tests):
1. Agrupar por `language ?? OTHER_DISTRICT`. Ordenar barrios por nº de repos desc (empate: nombre asc).
2. En cada barrio, ordenar edificios por altura desc. Lado del barrio en celdas: `side = ceil(sqrt(n))`. Colocar los edificios en las celdas del cuadrado `side×side` en **orden espiral desde el centro** (el más alto en el centro).
3. Tamaño de ranura de barrio `S = (maxSide + 1) * CELL` (el `+1` deja una avenida). Ranuras en espiral cuadrada sobre una rejilla de ranuras: la ranura índice 0 (origen) es la **plaza** y queda vacía; barrio i → ranura i+1.
4. `x, z` = centro de ranura + offset de celda × `CELL`. `width = depth = plotSize(stars)`.

Helper compartido (exportar y reutilizar en pasos 2 y 3): `spiral(n: number): Array<[number, number]>` → las primeras `n` coordenadas enteras de una espiral cuadrada empezando en `[0,0]`.

- [x] **Step 1: Tests que fallan:**
  - `buildingHeight(0) === 1`; `buildingHeight(1) === 2.5`; `buildingHeight(2000) < 18`.
  - `plotSize`: `0 → 1`, `1 → 1.5`, `9 → 1.5`, `10 → 2`.
  - `litRatio`: hace 10 días → `1`; hace 30 → `1`; hace 365 → `0.05`; hace 800 → `0.05`; hace ~197 días ≈ `0.525` (±0.01); fecha futura → `1`.
  - `spiral(9)` contiene las 9 celdas de `[-1..1]×[-1..1]` sin repetir y `spiral(1)` es `[[0,0]]`.
  - `cityLayout([], now)` → `[]`.
  - Un repo → 1 edificio, fuera de la plaza (no está en `(0,0)`).
  - 100 repos generados (5 lenguajes + algunos `null`) → 100 edificios, **ningún par solapa** (comprobar AABB con `width/depth` para todos los pares), cada edificio con `district` igual a su lenguaje o `'Otros'`.
  - Dentro de un barrio, el edificio más alto está en la celda central del barrio.
  - Todos los repos con `language: null` → todos `district === 'Otros'` y `color === NEUTRAL_COLOR`.
  - `color` de un repo con `languageColor: '#3178c6'` ≠ `'#3178c6'` y es `#rrggbb` válido.
- [x] **Step 2:** `npm test` → FAIL.
- [x] **Step 3:** Implementar.
- [x] **Step 4:** `npm test` → PASS.
- [x] **Step 5:** Commit `feat: layout de la ciudad`.

### Task 4: Cliente de la API

**Files:** Create `src/lib/api.ts`, `src/lib/api.test.ts`

**Interfaces — Produces:**
```ts
export class CityError extends Error { code: ApiErrorCode }
export async function fetchCity(user: string, fetchImpl: typeof fetch): Promise<CityResponse>;
```

- [x] **Step 1: Tests que fallan** (con `fetchImpl` falso): 200 → devuelve el JSON; 404 `{error:'USER_NOT_FOUND'}` → lanza `CityError` con `code === 'USER_NOT_FOUND'`; fallo de red (fetch rechaza) → `code === 'UPSTREAM_ERROR'`; el usuario se pasa con `encodeURIComponent` y `trim()`.
- [x] **Step 2:** FAIL → implementar → PASS.
- [x] **Step 3:** Commit `feat: cliente fetchCity`.

✅ **Fin del día 2:** `npm test` en verde con toda la lógica.

---

## Día 3 — Escena 3D básica

### Task 5: Rutas y página de ciudad mínima

**Files:** Create `src/App.tsx`, `src/pages/CityPage.tsx`, `src/pages/Home.tsx` (placeholder), `src/pages/NotFound.tsx` (placeholder); Modify `src/main.tsx`

**Interfaces — Produces:** `CityPage` lee `:user`, llama a `fetchCity`, calcula `useMemo(() => cityLayout(data.repos, new Date()))` y pasa `buildings: Building[]` y `user` a `CityScene`. Estado: `{ status: 'loading' } | { status: 'error', code: ApiErrorCode } | { status: 'ok', data: CityResponse }`.

- [x] **Step 1:** Router con `/`, `/ciudad/:user`, `*` → NotFound.
- [x] **Step 2:** `CityPage` con el estado anterior (pantallas de carga/error provisionales con texto).
- [x] **Step 3:** Commit `feat: rutas y CityPage`.

### Task 6: Escena con edificios instanciados

**Files:** Create `src/scene/CityScene.tsx`, `src/scene/Buildings.tsx`, `src/scene/Ground.tsx`

**Interfaces — Produces:** `<CityScene buildings={Building[]} avatarUrl={string} />`; `<Buildings buildings onHover={(i: number|null)=>void} onSelect={(i: number)=>void} hovered={number|null} />` (se usan en Task 8).

- [x] **Step 1:** `CityScene`: `<Canvas shadows gl={{ preserveDrawingBuffer: true }} camera={{ position: [40, 40, 40], fov: 45 }}>`, luz ambiental + direccional, `OrbitControls` con `maxPolarAngle = Math.PI/2.2`, `minDistance 10`, `maxDistance` según extensión de la ciudad.
- [x] **Step 2:** `Buildings`: un `InstancedMesh` de `BoxGeometry(1,1,1)` con origen desplazado a la base; matriz por instancia con escala `(width, height, depth)` y posición `(x, height/2, z)`; color por instancia.
- [x] **Step 3:** `Ground`: plano de suelo oscuro + plaza central con el avatar como textura en un monolito/cartel.
- [ ] **Step 4: Verificar** con `npx vercel dev` → `/ciudad/<tu usuario>` muestra la ciudad y la cámara orbita. **👤 Paso manual:** mirarla y confirmar que se entiende.
  - **Estado:** build y lint correctos; la CLI no pudo recuperar el proyecto por la red restringida y el navegador de Codex bloqueó la URL local, así que falta esta revisión visual.
- [x] **Step 5:** Commit `feat: escena 3D básica`.

✅ **Fin del día 3:** ves tu ciudad en 3D.

---

## Día 4 — Interacción

### Task 7: UserCard y RepoPanel

**Files:** Create `src/ui/UserCard.tsx`, `src/ui/RepoPanel.tsx`, `src/ui/Tooltip.tsx`, `src/styles.css`

**Interfaces — Consumes:** `CityResponse`, `Repo`, `Building`.

- [x] **Step 1:** `UserCard` (arriba izquierda): avatar, nombre (o login), nº de repos, contribuciones del último año.
- [x] **Step 2:** `RepoPanel({ repo, onClose })`: nombre, descripción, ⭐, lenguaje, commits, último push en formato relativo (`Intl.RelativeTimeFormat('es')`), botón "Ver en GitHub" (`target="_blank" rel="noopener"`). Lateral ≥ 768 px, *bottom sheet* por debajo. Cierra con Esc y con ×.
- [x] **Step 3:** `Tooltip`: sigue al puntero y muestra el nombre del repo.
- [ ] **Step 4:** Commit `feat: UserCard, RepoPanel y Tooltip`.

### Task 8: Hover y clic sobre edificios

**Files:** Modify `src/scene/Buildings.tsx`, `src/pages/CityPage.tsx`

- [ ] **Step 1:** En `Buildings`, usar `event.instanceId` de `onPointerMove`/`onPointerOut`/`onClick` para llamar a `onHover`/`onSelect`; el edificio en hover se aclara (color de instancia) y el cursor pasa a `pointer`.
- [ ] **Step 2:** `CityPage` guarda `hovered` y `selected`; enlaza el índice con el `Repo` vía `repoName`.
- [ ] **Step 3: Verificar** en navegador: hover resalta + tooltip; clic abre panel con datos correctos; Esc lo cierra.
- [ ] **Step 4:** Commit `feat: interacción con edificios`.

✅ **Fin del día 4:** puedes explorar tus repos desde la ciudad.

---

## Día 5 — Día/noche y estética

### Task 9a: Interpolación día/noche (TDD)

**Files:** Create `src/scene/timeOfDay.ts`, `src/scene/timeOfDay.test.ts`

**Interfaces — Produces:**
```ts
export type Lighting = { sky: string; sun: number; ambient: number; windowGlow: number; bloom: number };
export const KEYFRAMES: Record<'day' | 'sunset' | 'night', Lighting>;
export function lightingAt(t: number): Lighting; // t ∈ [0,1]: 0 = día, 0.5 = atardecer, 1 = noche; fuera de rango se acota
```

- [ ] **Step 1: Tests que fallan:** `lightingAt(0)` = `KEYFRAMES.day`; `lightingAt(0.5)` = `KEYFRAMES.sunset`; `lightingAt(1)` = `KEYFRAMES.night`; `lightingAt(0.25).sun` entre los de day y sunset; `lightingAt(-1)` = day y `lightingAt(2)` = night; `KEYFRAMES.day.bloom === 0`.
- [ ] **Step 2:** FAIL → implementar (interpolación lineal de números y de colores hex) → PASS.
- [ ] **Step 3:** Commit `feat: interpolación día/noche`.

### Task 9b: Ventanas, cielo, bloom y animación de entrada

**Files:** Create `src/scene/windowsMaterial.ts`, `src/scene/Sky.tsx`; Modify `CityScene.tsx`, `Buildings.tsx`

**Interfaces — Consumes:** `lightingAt` (9a), `Building.litRatio`.

- [ ] **Step 1:** `windowsMaterial`: `MeshStandardMaterial` con `onBeforeCompile` que, a partir de las UV de las caras laterales, dibuja una rejilla de ventanas; cada ventana se enciende si `hash(instanceId, celda) < litRatio` (atributo instanciado `aLit`). Emisión de ventanas multiplicada por un uniform `uGlow` = `lighting.windowGlow`. Tejados sin ventanas.
- [ ] **Step 2:** `Sky`: color de fondo/niebla y luces desde `lightingAt(t)`. Estado `t` en `CityPage`, valor inicial `0.5` (atardecer); transición animada de ~1,5 s al cambiar.
- [ ] **Step 3:** `EffectComposer` + `Bloom` con `intensity = lighting.bloom` (0 de día).
- [ ] **Step 4:** Animación de entrada: escala Y de cada instancia de 0 a 1 en ~1,2 s con *ease-out* y retraso proporcional a la distancia al centro.
- [ ] **Step 5: Verificar:** de noche los repos recientes brillan y los viejos están oscuros; FPS ~60 con un usuario de ~100 repos (drei `<Perf>` o `stats` temporal; quitarlo después). **👤 Paso manual:** juicio estético.
- [ ] **Step 6:** Commit `feat: ventanas, día/noche y bloom`.

✅ **Fin del día 5:** la ciudad de noche es el plano para el vídeo de LinkedIn.

---

## Día 6 — Home, compartir y errores

### Task 10: Toolbar, captura y enlace

**Files:** Create `src/ui/Toolbar.tsx`, `src/ui/screenshot.ts`

**Interfaces — Produces:** `captureCity(canvas: HTMLCanvasElement, login: string): Promise<Blob>`; descarga como `github-city-<login>.png`.

- [ ] **Step 1:** `captureCity`: dibuja el canvas en un canvas 2D auxiliar y añade abajo a la derecha el texto `github-city · miquelmanzano.com` con fondo semitransparente.
- [ ] **Step 2:** `Toolbar` (arriba derecha): botón día/noche (☀️/🌙), 📸 descarga, 🔗 `navigator.clipboard.writeText(location.href)` con aviso "¡Enlace copiado!" 2 s.
- [ ] **Step 3: Verificar:** el PNG descargado muestra la ciudad (no negro) y la marca de agua.
- [ ] **Step 4:** Commit `feat: captura y compartir`.

### Task 11: Home y buscador

**Files:** Create `src/ui/SearchBar.tsx`; Modify `src/pages/Home.tsx`

- [ ] **Step 1:** `SearchBar`: input con placeholder "Escribe un usuario de GitHub"; al enviar, `trim()`; si `!isValidUsername` muestra "Ese nombre de usuario no es válido" y no navega; si es válido, `navigate('/ciudad/' + user)`.
- [ ] **Step 2:** `Home`: `CityScene` de fondo con autorrotación lenta (datos de `miquel-manzano` o, si falla, un layout de ejemplo generado localmente), título, `SearchBar` y 3 ejemplos clicables (el usuario de Miquel + 2 devs conocidos, p. ej. `torvalds`, `gaearon`).
- [ ] **Step 3: Verificar:** `" torvalds "` navega a `/ciudad/torvalds`; `"a b"` muestra el error.
- [ ] **Step 4:** Commit `feat: Home con buscador`.

### Task 12: Estados de carga y error

**Files:** Create `src/ui/StatusScreen.tsx`; Modify `CityPage.tsx`, `NotFound.tsx`

- [ ] **Step 1:** Mapear estados (tabla §7 del spec): cargando → texto "Levantando tu ciudad…" sobre la escena; `USER_NOT_FOUND` → NotFound con mensaje "Este usuario no existe (o es una organización)" + `SearchBar`; 0 repos → ciudad con solo la plaza y cartel "🚧 En obras: aún no hay repos públicos"; `RATE_LIMITED` → "GitHub nos pide un respiro. Prueba en un minuto" + Reintentar; `UPSTREAM_ERROR` → "Algo ha fallado al hablar con GitHub" + Reintentar.
- [ ] **Step 2: Verificar** cada caso manualmente (usuario inexistente, usuario sin repos, y simular 429/502 apagando temporalmente el token).
- [ ] **Step 3:** Commit `feat: estados de carga y error`.

✅ **Fin del día 6:** producto completo en local.

---

## Día 7 — Móvil, pulido y despliegue

### Task 13: Móvil y Open Graph

**Files:** Modify `styles.css`, `CityScene.tsx`, `index.html`; Create `public/og.png`

- [ ] **Step 1:** En pantallas < 768 px: UI compacta, `RepoPanel` como *bottom sheet*, `dpr={[1, 2]}` en el Canvas.
- [ ] **Step 2:** `index.html`: `<title>GitHub City</title>`, `og:title`, `og:description` ("Convierte cualquier perfil de GitHub en una ciudad 3D"), `og:image` = `https://city.miquelmanzano.com/og.png`, `twitter:card=summary_large_image`.
- [ ] **Step 3:** `og.png` (1200×630): captura nocturna de la ciudad de Miquel hecha con el propio botón 📸.
- [ ] **Step 4: Verificar** en el modo responsive del navegador (375×812) y, si es posible, en un móvil real: gestos de cámara y panel.
- [ ] **Step 5:** Commit `feat: móvil y Open Graph`.

### Task 14: README y despliegue

**Files:** Create `README.md`

- [ ] **Step 1:** README: GIF/captura, enlace a la demo, qué es, stack, diagrama de arquitectura (front → `/api/city` → GitHub GraphQL, caché), decisiones técnicas (escala log, instancing, caché/rate limit, funciones puras testeadas), cómo ejecutarlo en local.
- [ ] **Step 2:** `npm test` y `npm run build` en verde.
- [ ] **Step 3:** Commit `docs: README`.
- [ ] **👤 Paso manual:** subir el repo a GitHub (público), importarlo en Vercel, añadir `GITHUB_TOKEN` en *Environment Variables*, desplegar.
- [ ] **👤 Paso manual:** en Vercel → Domains añadir `city.miquelmanzano.com`; en el proveedor DNS añadir el CNAME que indique Vercel.
- [ ] **Step 4: Verificar en producción:** Home, tu ciudad, un usuario inexistente, captura, enlace copiado, y la previsualización del enlace (LinkedIn Post Inspector).

✅ **Fin del día 7:** publicado y listo para el post de LinkedIn.
