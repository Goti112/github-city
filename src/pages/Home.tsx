import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { fetchCity } from '../lib/api'
import { cityLayout } from '../lib/cityLayout'
import { EXAMPLE_CITY } from '../lib/exampleCity'
import type { CityResponse } from '../lib/types'
import CityScene from '../scene/CityScene'
import SearchBar from '../ui/SearchBar'

type ExampleProfile = {
  login: string
  name: string
}

const exampleProfiles: ExampleProfile[] = [
  { login: 'miquel-manzano', name: 'Miquel' },
  { login: 'torvalds', name: 'Linus Torvalds' },
  { login: 'gaearon', name: 'Dan Abramov' },
]

const Home = (): ReactElement => {
  const [city, setCity] = useState<CityResponse>(EXAMPLE_CITY)
  const [now] = useState<Date>(() => new Date())
  const buildings = useMemo(() => cityLayout(city.repos, now), [city, now])

  useEffect(() => {
    let isCurrentRequest = true

    void fetchCity('miquel-manzano', fetch)
      .then((response) => {
        if (isCurrentRequest) {
          setCity(response)
        }
      })
      .catch((error: unknown) => {
        console.warn('No se pudo cargar la ciudad de ejemplo; se mantiene el conjunto local', {
          username: 'miquel-manzano',
          error,
        })
      })

    return () => {
      isCurrentRequest = false
    }
  }, [])

  return (
    <main className="home-page">
      <CityScene
        buildings={buildings}
        avatarUrl={city.user.avatarUrl}
        timeOfDay={0.72}
        hovered={null}
        autoRotateSpeed={0.16}
      />
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
