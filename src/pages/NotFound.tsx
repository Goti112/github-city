import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'

const NotFound = (): ReactElement => (
  <main className="placeholder-page">
    <p className="placeholder-page__eyebrow">GitHub City</p>
    <h1>No encontramos esta página</h1>
    <Link to="/">Volver al inicio</Link>
  </main>
)

export default NotFound
