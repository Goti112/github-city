import { useMemo, useState, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { cityLayout } from '../lib/cityLayout'
import { EXAMPLE_CITY } from '../lib/exampleCity'
import CityScene from '../scene/LazyCityScene'
import { SceneErrorBoundary } from '../ui/SceneErrorBoundary'
import CompareForm from '../ui/CompareForm'
import SearchBar from '../ui/SearchBar'

type ExampleProfile = {
  login: string
  name: string
}

const exampleProfiles: ExampleProfile[] = [
  { login: 'Goti112', name: 'Miquel' },
  { login: 'torvalds', name: 'Linus Torvalds' },
  { login: 'gaearon', name: 'Dan Abramov' },
]

// Big, well-known profiles that make impressive cities to explore.
const famousCities: ExampleProfile[] = [
  { login: 'sindresorhus', name: 'Sindre Sorhus' },
  { login: 'yyx990803', name: 'Evan You' },
  { login: 'tj', name: 'TJ Holowaychuk' },
  { login: 'addyosmani', name: 'Addy Osmani' },
]

const Home = (): ReactElement => {
  const [now] = useState<Date>(() => new Date())
  const [sceneAttempt, setSceneAttempt] = useState<number>(0)
  // The background is a generated demo city: always busy, instant, and costs no API call.
  const buildings = useMemo(() => cityLayout(EXAMPLE_CITY.repos, now), [now])
  const handleSceneRetry = (): void => {
    setSceneAttempt((current) => current + 1)
  }

  return (
    <main className="home-page">
      <SceneErrorBoundary
        key={sceneAttempt}
        fallback={(
          <div className="home-page__scene-error" role="alert">
            <span>La escena de ejemplo no está disponible. Puedes seguir buscando.</span>
            <button type="button" onClick={handleSceneRetry}>Reintentar escena</button>
          </div>
        )}
      >
        <CityScene
          buildings={buildings}
          avatarUrl={EXAMPLE_CITY.user.avatarUrl}
          timeOfDay={1}
          hovered={null}
          autoRotateSpeed={0.16}
          showLandmark={false}
        />
      </SceneErrorBoundary>
      <div className="home-page__overlay" aria-hidden="true" />
      <section className="home-page__content">
        <p className="home-page__eyebrow">GitHub City</p>
        <h1>Un perfil. Una ciudad.</h1>
        <p className="home-page__description">
          Convierte los repositorios públicos de GitHub en un lugar que puedes recorrer.
        </p>
        <SearchBar />
        <div className="home-page__examples">
          <span>Prueba con</span>
          {exampleProfiles.map(({ login, name }) => (
            <Link key={login} to={`/ciudad/${login}`}>{name}</Link>
          ))}
        </div>
        <div className="home-page__examples home-page__examples--famous">
          <span>Metrópolis famosas</span>
          {famousCities.map(({ login, name }) => (
            <Link key={login} to={`/ciudad/${login}`}>{name}</Link>
          ))}
        </div>
        <div className="home-page__duel">
          <span>¿O prefieres un duelo?</span>
          <CompareForm />
          <Link className="home-page__duel-example" to="/vs/torvalds/gaearon">Ver torvalds vs gaearon</Link>
        </div>
      </section>
    </main>
  )
}

export default Home
