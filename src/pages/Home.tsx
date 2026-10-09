import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'

const Home = (): ReactElement => (
  <main className="placeholder-page">
    <p className="placeholder-page__eyebrow">GitHub City</p>
    <h1>Tu actividad de GitHub, convertida en una ciudad</h1>
    <p>Explora perfiles públicos y descubre cómo crecen sus repositorios.</p>
    <Link to="/ciudad/torvalds">Ver una ciudad de ejemplo</Link>
  </main>
)

export default Home
