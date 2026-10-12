import { lazy } from 'react'

// Three.js is most of the bundle; loading it separately lets the page text paint first.
const LazyCityScene = lazy(() => import('./CityScene'))

export default LazyCityScene
