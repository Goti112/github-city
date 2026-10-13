export type Lang = 'es' | 'en'

const es = {
  homeTitle: 'Un perfil. Una ciudad.',
  homeDescription: 'Convierte los repositorios públicos de GitHub en un lugar que puedes recorrer.',
  tryWith: 'Prueba con',
  famous: 'Metrópolis famosas',
  duelPrompt: '¿O prefieres un duelo?',
  duelExample: 'Ver torvalds vs gaearon',
  sceneUnavailableHome: 'La escena de ejemplo no está disponible. Puedes seguir buscando.',
  retryScene: 'Reintentar escena',
  searchPlaceholder: 'Escribe un usuario de GitHub',
  searchLabel: 'Usuario de GitHub',
  searchButton: 'Crear ciudad',
  invalidUser: 'Ese nombre de usuario no es válido',
  buildings: 'Edificios',
  population: 'Habitantes',
  districts: 'Distritos',
  lit: 'Encendidos',
  stars: 'Estrellas',
  contributions: 'Aportes / año',
  skyscraper: 'Rascacielos',
  mainDistrict: 'Barrio principal',
  ofTheCity: 'de la ciudad',
  builtOf: (built: number, total: number): string => `${built} de ${total} edificios`,
  playHistory: 'Ver cómo se construyó la ciudad',
  pauseHistory: 'Pausar la historia',
  year: 'Año',
  language: 'Idioma',
}

export type Strings = typeof es

const en: Strings = {
  homeTitle: 'One profile. One city.',
  homeDescription: 'Turn public GitHub repositories into a place you can explore.',
  tryWith: 'Try',
  famous: 'Famous metropolises',
  duelPrompt: 'Or fancy a duel?',
  duelExample: 'See torvalds vs gaearon',
  sceneUnavailableHome: 'The demo scene is unavailable. You can still search.',
  retryScene: 'Retry scene',
  searchPlaceholder: 'Type a GitHub username',
  searchLabel: 'GitHub username',
  searchButton: 'Build city',
  invalidUser: 'That username is not valid',
  buildings: 'Buildings',
  population: 'Residents',
  districts: 'Districts',
  lit: 'Lit up',
  stars: 'Stars',
  contributions: 'Contributions / yr',
  skyscraper: 'Skyscraper',
  mainDistrict: 'Main district',
  ofTheCity: 'of the city',
  builtOf: (built, total) => `${built} of ${total} buildings`,
  playHistory: 'Watch how the city was built',
  pauseHistory: 'Pause the history',
  year: 'Year',
  language: 'Language',
}

export const strings: Record<Lang, Strings> = { es, en }

// City size titles shown in the UI (cityStats keeps the Spanish key).
export const cityTitles: Record<string, string> = {
  'Solar en obras': 'Construction site',
  Aldea: 'Hamlet',
  Pueblo: 'Town',
  Ciudad: 'City',
  Metrópolis: 'Metropolis',
}
