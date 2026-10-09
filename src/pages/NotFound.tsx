import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import SearchBar from '../ui/SearchBar'

const NotFound = (): ReactElement => (
  <main className="placeholder-page">
    <p className="placeholder-page__eyebrow">GitHub City</p>
    <h1>No encontramos esta página</h1>
    <Link to="/">Volver al inicio</Link>
  </main>
)

export const UserNotFound = (): ReactElement => (
  <main className="placeholder-page">
    <p className="placeholder-page__eyebrow">GitHub City</p>
    <h1>Este usuario no existe (o es una organización)</h1>
    <p>Prueba con otro nombre de usuario de GitHub.</p>
    <SearchBar />
    <Link to="/">Volver al inicio</Link>
  </main>
)

export default NotFound
