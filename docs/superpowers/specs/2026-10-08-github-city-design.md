# GitHub City — Diseño (v1)

**Fecha:** 2026-10-08
**Autor:** Miquel Manzano
**Estado:** Pendiente de revisión

## 1. Objetivo

Pieza de portfolio pública que demuestre capacidad de construir producto completo (front 3D + backend serverless) y que impresione en los primeros 10 segundos a recruiters que la vean desde LinkedIn.

**Producto:** introduces un usuario de GitHub y se genera una ciudad 3D donde cada repositorio público es un edificio.

**Criterios de éxito:**
- Se prueba sin registro, desde una URL pública, en escritorio y móvil.
- Carga una ciudad en < 3 s (con caché caliente) y se mueve a ~60 fps con 100 repos en un portátil medio.
- Nunca muestra una pantalla rota: todos los errores tienen un estado visual propio.
- Coste: 0 €.

**No objetivos (fuera de v1):** comparar usuarios, repos privados, login, guardar ciudades, imágenes OG dinámicas por usuario, build in public.

## 2. Stack y despliegue

- **Front:** Vite + React + TypeScript, React Three Fiber, @react-three/drei, @react-three/postprocessing (bloom), React Router.
- **Backend:** una función serverless de Vercel (`api/city/[user].ts`).
- **Datos:** API GraphQL de GitHub con un Personal Access Token (variable de entorno `GITHUB_TOKEN`, solo permisos de lectura pública).
- **Tests:** Vitest.
- **Hosting:** Vercel plan Hobby (gratuito, sin tarjeta). Dominio: `city.miquelmanzano.com` (registro CNAME).

## 3. Arquitectura

```
github-city/
├─ api/city/[user].ts       función serverless: GitHub → JSON de ciudad
├─ src/
│  ├─ lib/
│  │  ├─ github.ts          query GraphQL + transformador (puro, testeado)
│  │  ├─ cityLayout.ts      JSON de ciudad → edificios posicionados (puro, testeado)
│  │  └─ types.ts           tipos compartidos front/api
│  ├─ scene/                City, Building(s) instanciados, Sky, Plaza, Camera
│  ├─ ui/                   SearchBar, UserCard, RepoPanel, Toolbar, Tooltip
│  └─ pages/                Home, CityPage, NotFound
```

**Flujo:** `/ciudad/:user` → `fetch /api/city/:user` → la función ejecuta una única consulta GraphQL → transforma → responde con cabecera `Cache-Control: s-maxage=3600, stale-while-revalidate=86400` → el front ejecuta `cityLayout()` → renderiza la escena.

### 3.1 Contrato de la API

`GET /api/city/:user`

```ts
type CityResponse = {
  user: { login: string; name: string | null; avatarUrl: string };
  repos: Array<{
    name: string;
    description: string | null;
    url: string;
    stars: number;
    language: string | null;      // null → barrio "Otros"
    languageColor: string | null; // color oficial de GitHub
    commits: number;              // commits en la rama por defecto
    lastPush: string;             // ISO 8601
  }>;
  activity: { totalContributions: number; last30Days: number };
};
```

- Incluye hasta 100 repos públicos propios, **excluyendo forks** (los archivados sí se incluyen; saldrán oscuros por inactividad), ordenados por último push.
- Respuestas de error: `404 { error: "USER_NOT_FOUND" }`, `429 { error: "RATE_LIMITED" }`, `400 { error: "INVALID_USERNAME" }` (validación: `^[a-zA-Z0-9-]{1,39}$`), `502 { error: "UPSTREAM_ERROR" }`.

## 4. Mapeo datos → ciudad (`cityLayout.ts`)

Función pura: `cityLayout(repos, now) → Building[]` donde

```ts
type Building = {
  repoName: string;
  x: number; z: number;           // posición en el suelo
  width: number; depth: number;   // tamaño de parcela
  height: number;
  color: string;
  litRatio: number;               // 0..1, proporción de ventanas encendidas
  district: string;               // lenguaje
};
```

- **Altura:** `1 + log2(commits + 1) * 1.5`.
- **Parcela:** 1×1 si 0 estrellas; 1.5×1.5 si 1–9; 2×2 si ≥ 10.
- **Color:** `languageColor` con saturación reducida; gris neutro si no hay lenguaje.
- **litRatio:** 1.0 si push ≤ 30 días; interpolación lineal hasta 0.05 a los 365 días; 0.05 por encima.
- **Barrios:** repos agrupados por lenguaje; dentro de cada barrio, cuadrícula de manzanas separadas por calles con el edificio más alto en el centro. Los barrios se colocan en espiral alrededor de una plaza central (avatar del usuario), del más grande al más pequeño.
- **Invariante:** ningún par de edificios se solapa.

## 5. Escena 3D

- Edificios con `InstancedMesh` (pocas draw calls); ventanas mediante textura/shader, no geometría.
- Animación de entrada: los edificios crecen desde el suelo de forma escalonada.
- **Día/noche:** control que interpola luz, cielo y emisión de ventanas. Arranca en atardecer. Bloom suave solo de noche.
- Cámara: OrbitControls con límites (no atraviesa el suelo, zoom acotado), autorotación lenta en Home. Gestos táctiles en móvil.
- Hover: resalta el edificio y muestra tooltip con el nombre. Clic: abre RepoPanel.

## 6. Interfaz

- **Home (`/`):** ciudad de ejemplo girando de fondo, buscador central, 3 usuarios de ejemplo clicables.
- **Ciudad (`/ciudad/:user`):**
  - UserCard (arriba izquierda): avatar, nombre, nº de repos, contribuciones del último año.
  - Toolbar (arriba derecha): día/noche, 📸 descargar PNG, 🔗 copiar enlace.
  - RepoPanel: nombre, descripción, estrellas, lenguaje, commits, último push, botón "Ver en GitHub". Lateral en escritorio, bottom sheet en móvil.
- **Compartir:** la captura se genera desde el canvas (`preserveDrawingBuffer`) con marca de agua "github-city · miquelmanzano.com". Etiquetas Open Graph estáticas con imagen genérica del proyecto.

## 7. Estados y errores

| Caso | Comportamiento |
|---|---|
| Cargando | Animación de edificios creciendo + texto de carga |
| Usuario inexistente | Página 404 propia con buscador |
| Usuario sin repos | Solar vacío con cartel "en obras" 🚧 |
| Rate limit | Mensaje claro + botón reintentar |
| Error de GitHub/red | Mensaje genérico + reintentar |
| Nombre inválido | Validación en el buscador antes de navegar |

## 8. Testing

- **Vitest — `cityLayout.ts`:** fórmula de altura, tamaños de parcela, litRatio por antigüedad, agrupación por lenguaje, ausencia de solapes, casos 0 / 1 / 100 repos, repos sin lenguaje.
- **Vitest — `github.ts`:** transformación de una respuesta GraphQL de ejemplo (fixture), exclusión de forks, mapeo de errores (usuario no encontrado, rate limit).
- **Manual antes de publicar:** escritorio (Chrome, Firefox), móvil, rendimiento con un usuario de ~100 repos, captura PNG, enlace compartido.
