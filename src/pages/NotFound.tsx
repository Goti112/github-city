import type { ReactElement } from 'react'
import { useStrings } from '../i18n/useLang'
import { Link } from 'react-router-dom'
import SearchBar from '../ui/SearchBar'

const NotFound = (): ReactElement => {
  const t = useStrings()
  return (
  <main className="placeholder-page">
    <p className="placeholder-page__eyebrow">GitHub City</p>
    <h1>{t.pageNotFound}</h1>
    <Link to="/">{t.backHome}</Link>
  </main>
  )
}

export const UserNotFound = (): ReactElement => {
  const t = useStrings()
  return (
  <main className="placeholder-page">
    <p className="placeholder-page__eyebrow">GitHub City</p>
    <h1>{t.userNotFound}</h1>
    <p>{t.tryAnother}</p>
    <SearchBar />
    <Link to="/">{t.backHome}</Link>
  </main>
  )
}

export default NotFound
