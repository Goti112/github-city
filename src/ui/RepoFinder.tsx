import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from 'react'
import { searchRepos } from '../lib/searchRepos'
import type { Repo } from '../lib/types'

type RepoFinderProps = {
  repos: Repo[]
  onSelect: (repo: Repo) => void
  onClose: () => void
}

const numberFormat = new Intl.NumberFormat('es')

// Keyboard-first way to reach any building: also the accessible alternative to clicking in 3D.
const RepoFinder = ({ repos, onSelect, onClose }: RepoFinderProps): ReactElement => {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listId = useId()
  const results = useMemo(() => searchRepos(repos, query, 8), [repos, query])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const choose = (repo: Repo | undefined): void => {
    if (repo !== undefined) {
      onSelect(repo)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => Math.min(current + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(results[active])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  return (
    <div className="repo-finder" role="dialog" aria-label="Buscar un edificio">
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={listId}
        aria-activedescendant={results[active] === undefined ? undefined : `${listId}-${active}`}
        aria-label="Buscar un repositorio por nombre o lenguaje"
        placeholder="Buscar edificio por nombre o lenguaje…"
        value={query}
        onChange={(event) => {
          setQuery(event.currentTarget.value)
          setActive(0)
        }}
        onKeyDown={handleKeyDown}
      />
      <ul id={listId} role="listbox" className="repo-finder__list">
        {results.map((repo, index) => (
          <li
            key={repo.name}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            className={index === active ? 'is-active' : undefined}
            onMouseEnter={() => setActive(index)}
            onMouseDown={(event) => {
              event.preventDefault()
              choose(repo)
            }}
          >
            <span className="repo-finder__dot" style={{ background: repo.languageColor ?? '#8a8f98' }} aria-hidden="true" />
            <span className="repo-finder__name">{repo.name}</span>
            <span className="repo-finder__meta">{repo.language ?? 'Otros'} · {numberFormat.format(repo.commits)} commits</span>
          </li>
        ))}
        {results.length === 0 && <li className="repo-finder__empty" role="presentation">Ningún edificio coincide</li>}
      </ul>
    </div>
  )
}

export default RepoFinder
