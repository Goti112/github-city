# GitHub City

[![CI](https://github.com/Goti112/github-city/actions/workflows/ci.yml/badge.svg)](https://github.com/Goti112/github-city/actions/workflows/ci.yml)
[![Demo](https://img.shields.io/badge/demo-city.miquelmanzano.com-73e0c0)](https://city.miquelmanzano.com)

**Convierte cualquier perfil de GitHub en una ciudad 3D que puedes recorrer.**
Cada repositorio es un edificio; los commits lo hacen crecer, la actividad reciente enciende sus ventanas y cada lenguaje forma su propio barrio.

👉 **[Prueba con tu usuario en city.miquelmanzano.com](https://city.miquelmanzano.com)**

![Ciudad de noche generada a partir de un perfil de GitHub](docs/screenshots/city-night.jpg)

## Qué hace

- **Vuelo de cámara cinematográfico** al entrar, mientras cae la noche sobre la ciudad.
- **Ciudad viva:** calles iluminadas, tráfico de luces, balizas en los tejados de los repos con estrellas y un edificio emblemático con haz de luz.
- **Tu ciudad en cifras:** de *Aldea* a *Metrópolis* según tus repos, con habitantes (commits), distritos, edificios encendidos, estrellas, tu rascacielos y tu barrio principal.
- **Explora:** gira, acerca y selecciona cualquier edificio para ver su repositorio.
- **Comparte:** cada `/ciudad/:usuario` tiene su propia tarjeta de vista previa para LinkedIn, X o WhatsApp, generada al vuelo con su skyline. También puedes descargar una captura PNG.
- Día, atardecer y noche; diseño adaptado a móvil; estados propios para usuarios inexistentes, perfiles vacíos y límites de GitHub.

<img src="docs/screenshots/share-card.png" alt="Tarjeta de vista previa generada para un perfil" width="600" />

## De datos a ciudad

| Dato de GitHub | En la ciudad |
| --- | --- |
| Commits de la rama principal | Altura: `1 + log2(commits + 1) × 1.5` (logarítmica, para que un repo enorme no aplaste al resto) |
| Estrellas | Tamaño de la parcela y baliza roja en el tejado |
| Lenguaje principal | Barrio y color de neón del edificio |
| Último push | Ventanas encendidas: todas si fue hace ≤ 30 días, casi ninguna pasado un año |
| Repo con más estrellas | Edificio emblemático con haz de luz |

Los barrios se empaquetan de forma voraz alrededor de una plaza central con tu avatar, del más grande al más pequeño, y las calles discurren entre parcelas.

## Arquitectura

```mermaid
flowchart LR
    Browser[React + React Three Fiber] -->|GET /api/city/:user| City[Función: api/city]
    Crawler[LinkedIn / X / WhatsApp] -->|GET /ciudad/:user| MW[Middleware: meta Open Graph]
    Crawler -->|GET /api/og/:user| OG[Función: api/og · @vercel/og]
    City --> Load[api/_lib/loadCity]
    OG --> Load
    Load -->|1 consulta GraphQL| GitHub[GitHub GraphQL API]
    Browser --> Layout[cityLayout · cityStats]
    Layout --> Scene[Escena: instancing + shaders]
```

- **Una sola consulta GraphQL** por perfil (perfil, 100 repos y calendario de contribuciones) desde una función serverless; el token nunca llega al navegador.
- **Caché en el edge:** `s-maxage=3600, stale-while-revalidate=86400`; un usuario inexistente se cachea 5 minutos y el resto de errores no se cachean. Las tarjetas de vista previa se cachean un día.
- **Vistas previas dinámicas:** los robots de las redes sociales no ejecutan JavaScript, así que un middleware sirve `/ciudad/:usuario` con las etiquetas Open Graph de ese usuario y `/api/og/:usuario` dibuja la tarjeta con `@vercel/og`.

## Decisiones técnicas

- **Lógica pura y testeada:** el transformador de GitHub, el layout de la ciudad, las cifras, el skyline de la tarjeta, el encuadre de cámara, el tráfico y las etiquetas de compartir son funciones puras con tests (Vitest, 79 tests).
- **Rendimiento:** todos los edificios se dibujan con un único `InstancedMesh`; ventanas, coronas de neón y calles se calculan en shaders, sin geometría extra. La escena 3D se carga bajo demanda: el bundle inicial pesa ~200 kB y Three.js llega aparte.
- **Cámara adaptativa:** el encuadre y la niebla se calculan a partir del tamaño de la ciudad, su edificio más alto y la proporción de la pantalla, así que una ciudad de 5 repos y una de 100 se ven enteras, también en vertical.
- **Accesibilidad:** el vuelo de cámara se omite con `prefers-reduced-motion`; buscador, barra de herramientas y panel son controles HTML accesibles con teclado (Esc cierra el panel del repositorio).
- **Robustez:** reintentos ante errores transitorios de GitHub, detección del rate limit de GraphQL (que llega como HTTP 200) y `api/` comprobado con la resolución de módulos de Node ESM para que los fallos de importación salgan en CI y no en producción.

## Stack

React 18 · TypeScript · Vite · React Three Fiber · Drei · postprocessing · React Router · Vercel Functions y Routing Middleware · `@vercel/og` · GitHub GraphQL API · Vitest · Oxlint · GitHub Actions

## Ejecutar en local

```bash
npm install
cp .env.example .env   # añade GITHUB_TOKEN=... (token de GitHub con lectura de repos públicos)
npm start              # vercel dev: front + funciones + middleware en http://localhost:3000
```

`npm run dev` levanta solo Vite, sin las funciones serverless.

```bash
npm run lint   # oxlint + comprobación de tipos de api/ y middleware
npm test
npm run build
```

---

Hecho por [Miquel Manzano](https://miquelmanzano.com).
