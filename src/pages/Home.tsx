import { useMemo, useState, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { cityLayout } from '../lib/cityLayout'
import { EXAMPLE_CITY } from '../lib/exampleCity'
import CityScene from '../scene/CityScene'
import { SceneErrorBoundary } from '../ui/SceneErrorBoundary'
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
          timeOfDay={0.72}
          hovered={null}
          autoRotateSpeed={0.16}
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
      </section>
    </main>
  )
}

export default Home
