import { useState, type ChangeEvent, type FormEvent, type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStrings } from '../i18n/useLang'
import { normalizeUsername } from '../lib/search'

const SearchBar = (): ReactElement => {
  const navigate = useNavigate()
  const t = useStrings()
  const [username, setUsername] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const normalizedUsername = normalizeUsername(username)
    if (normalizedUsername === null) {
      setErrorMessage(t.invalidUser)
      return
    }

    setErrorMessage(null)
    navigate(`/ciudad/${normalizedUsername}`)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setUsername(event.currentTarget.value)
    setErrorMessage(null)
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <label className="search-bar__label" htmlFor="github-username">{t.searchLabel}</label>
      <input
        id="github-username"
        name="username"
        type="text"
        autoComplete="off"
        placeholder={t.searchPlaceholder}
        value={username}
        aria-invalid={errorMessage !== null}
        aria-describedby={errorMessage === null ? undefined : 'search-bar-error'}
        onChange={handleChange}
      />
      <button type="submit">{t.searchButton} <span aria-hidden="true">↗</span></button>
      {errorMessage !== null && <p className="search-bar__error" id="search-bar-error" role="alert">{errorMessage}</p>}
    </form>
  )
}

export default SearchBar
