import { useState, type FormEvent, type ReactElement } from 'react'
import { useStrings } from '../i18n/useLang'
import { useNavigate } from 'react-router-dom'
import { normalizeUsername } from '../lib/search'

type CompareFormProps = {
  /** Pre-filled challenger, e.g. the city being viewed. */
  left?: string
  compact?: boolean
}

// "@a vs @b" form that opens the city duel.
const CompareForm = ({ left = '', compact = false }: CompareFormProps): ReactElement => {
  const navigate = useNavigate()
  const t = useStrings()
  const [first, setFirst] = useState(left)
  const [second, setSecond] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const a = normalizeUsername(first)
    const b = normalizeUsername(second)
    if (a === null || b === null) {
      setError(t.duelInvalid)
      return
    }
    if (a.toLowerCase() === b.toLowerCase()) {
      setError(t.duelSelf)
      return
    }
    navigate(`/vs/${a}/${b}`)
  }

  return (
    <form className={`compare-form${compact ? ' compare-form--compact' : ''}`} onSubmit={handleSubmit}>
      {!compact && (
        <input
          aria-label={t.firstUser}
          placeholder={t.firstPlaceholder}
          value={first}
          onChange={(event) => {
            setFirst(event.currentTarget.value)
            setError(null)
          }}
        />
      )}
      <span className="compare-form__vs" aria-hidden="true">vs</span>
      <input
        aria-label={t.rivalUser}
        placeholder={t.rivalPlaceholder}
        value={second}
        autoFocus={compact}
        onChange={(event) => {
          setSecond(event.currentTarget.value)
          setError(null)
        }}
      />
      <button type="submit">{t.duelButton}</button>
      {error !== null && <p className="compare-form__error" role="alert">{error}</p>}
    </form>
  )
}

export default CompareForm
