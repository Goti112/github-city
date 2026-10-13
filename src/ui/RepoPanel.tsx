import { useEffect, useState, type ReactElement } from 'react'
import type { Repo } from '../lib/types'

type RepoPanelProps = {
  repo: Repo
  onClose: () => void
}

const relativeTimeFormat = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

const formatRelativeTime = (lastPush: string, now: Date): string => {
  const lastPushTime = new Date(lastPush).getTime()
  if (!Number.isFinite(lastPushTime)) {
    throw new RangeError(`El repositorio tiene una fecha de push inválida: ${lastPush}`)
  }

  const elapsedSeconds = Math.round((lastPushTime - now.getTime()) / 1000)
  const elapsedMagnitude = Math.abs(elapsedSeconds)
  if (elapsedMagnitude >= 31_536_000) {
    return relativeTimeFormat.format(Math.round(elapsedSeconds / 31_536_000), 'year')
  }
  if (elapsedMagnitude >= 2_592_000) {
    return relativeTimeFormat.format(Math.round(elapsedSeconds / 2_592_000), 'month')
  }
  if (elapsedMagnitude >= 604_800) {
    return relativeTimeFormat.format(Math.round(elapsedSeconds / 604_800), 'week')
  }
  if (elapsedMagnitude >= 86_400) {
    return relativeTimeFormat.format(Math.round(elapsedSeconds / 86_400), 'day')
  }
  if (elapsedMagnitude >= 3_600) {
    return relativeTimeFormat.format(Math.round(elapsedSeconds / 3_600), 'hour')
  }
  return relativeTimeFormat.format(Math.round(elapsedSeconds / 60), 'minute')
}

const numberFormat = new Intl.NumberFormat('es')
const monthYearFormat = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric', timeZone: 'UTC' })

const RepoPanel = ({ repo, onClose }: RepoPanelProps): ReactElement => {
  const [now] = useState<Date>(() => new Date())

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <aside className="repo-panel" aria-labelledby="repo-panel-title">
      <button
        className="repo-panel__close"
        type="button"
        aria-label="Cerrar panel del repositorio"
        onClick={onClose}
      >
        ×
      </button>
      <p className="repo-panel__eyebrow">{repo.language ?? 'Otros'}</p>
      <h2 className="repo-panel__title" id="repo-panel-title">{repo.name}</h2>
      <p className="repo-panel__description">
        {repo.description ?? 'Este repositorio no tiene descripción.'}
      </p>
      <dl className="repo-panel__stats">
        <div>
          <dt>Estrellas</dt>
          <dd>⭐ {numberFormat.format(repo.stars)}</dd>
        </div>
        <div>
          <dt>Commits</dt>
          <dd>{numberFormat.format(repo.commits)}</dd>
        </div>
        <div>
          <dt>Último push</dt>
          <dd><time dateTime={repo.lastPush}>{formatRelativeTime(repo.lastPush, now)}</time></dd>
        </div>
        <div>
          <dt>Construido en</dt>
          <dd><time dateTime={repo.createdAt}>{monthYearFormat.format(new Date(repo.createdAt))}</time></dd>
        </div>
      </dl>
      <a className="repo-panel__link" href={repo.url} target="_blank" rel="noopener">
        Ver en GitHub <span aria-hidden="true">↗</span>
      </a>
    </aside>
  )
}

export default RepoPanel
