import { useMemo, useState, type ReactElement } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cityLayout } from '../lib/cityLayout'
import { cityStats } from '../lib/cityStats'
import { compareCities, type ComparableCity } from '../lib/compare'
import type { CityResponse } from '../lib/types'
import { useCity, type CityState } from '../lib/useCity'
import type { Strings } from '../i18n/strings'
import { useCityTitle, useStrings } from '../i18n/useLang'
import CityScene from '../scene/LazyCityScene'
import CompareForm from '../ui/CompareForm'
import { SceneErrorBoundary } from '../ui/SceneErrorBoundary'
import StatusScreen from '../ui/StatusScreen'

const numberFormat = new Intl.NumberFormat('es')

const comparable = (data: CityResponse, now: Date): ComparableCity => {
  const stats = cityStats(data.repos, now)
  return {
    buildings: data.repos.length,
    population: stats.population,
    stars: stats.stars,
    districts: stats.districts,
    litBuildings: stats.litBuildings,
    contributions: data.activity.totalContributions,
  }
}

type SideProps = { data: CityResponse; now: Date; winner: boolean }

const CitySide = ({ data, now, winner }: SideProps): ReactElement => {
  const t = useStrings()
  const buildings = useMemo(() => cityLayout(data.repos, now), [data, now])
  const stats = useMemo(() => cityStats(data.repos, now), [data, now])
  const title = useCityTitle(stats.title)
  return (
    <section className={`duel-side${winner ? ' duel-side--winner' : ''}`} aria-label={`Ciudad de ${data.user.login}`}>
      <SceneErrorBoundary fallback={<StatusScreen role="alert"><p>{t.sceneUnavailable}</p></StatusScreen>}>
        <CityScene buildings={buildings} avatarUrl={data.user.avatarUrl} timeOfDay={1} hovered={null} autoRotateSpeed={0.35} />
      </SceneErrorBoundary>
      <Link className="duel-side__header" to={`/ciudad/${data.user.login}`}>
        <img src={data.user.avatarUrl} alt="" />
        <span>
          <strong>{data.user.name ?? data.user.login}</strong>
          <small>@{data.user.login} · {title}</small>
        </span>
        {winner && <span className="duel-side__crown" aria-label={t.winner}>👑</span>}
      </Link>
    </section>
  )
}

const failure = (login: string, state: CityState, t: Strings): string | null =>
  state.status === 'error' ? `@${login} ${t.duelErrors[state.code] ?? t.duelErrors.UPSTREAM_ERROR}` : null

const ComparePage = (): ReactElement => {
  const t = useStrings()
  const { left = '', right = '' } = useParams()
  const leftCity = useCity(left)
  const rightCity = useCity(right)
  const [now] = useState(() => new Date())

  const result = useMemo(() => {
    if (leftCity.status !== 'ok' || rightCity.status !== 'ok') {
      return null
    }
    return compareCities(comparable(leftCity.data, now), comparable(rightCity.data, now))
  }, [leftCity, rightCity, now])

  const errors = [failure(left, leftCity, t), failure(right, rightCity, t)].filter((text): text is string => text !== null)
  if (errors.length > 0) {
    return (
      <main className="placeholder-page">
        <p className="placeholder-page__eyebrow">GitHub City · Duelo</p>
        {errors.map((text) => <h1 key={text}>{text}</h1>)}
        <CompareForm left={leftCity.status === 'ok' ? left : ''} />
        <Link to="/">{t.backHome}</Link>
      </main>
    )
  }

  if (leftCity.status !== 'ok' || rightCity.status !== 'ok' || result === null) {
    return <main className="duel-page"><StatusScreen role="status"><p>{t.loadingDuel}</p></StatusScreen></main>
  }

  const verdict = result.overall === 'tie'
    ? t.tie
    : t.wins(result.overall === 'left' ? leftCity.data.user.login : rightCity.data.user.login)

  return (
    <main className="duel-page">
      <CitySide data={leftCity.data} now={now} winner={result.overall === 'left'} />
      <CitySide data={rightCity.data} now={now} winner={result.overall === 'right'} />
      <section className="duel-board" aria-label="Marcador del duelo">
        <p className="duel-board__eyebrow">{t.duelHeading}</p>
        <p className="duel-board__score">
          <span>{result.score.left}</span> – <span>{result.score.right}</span>
        </p>
        <p className="duel-board__verdict">{verdict}</p>
        <table>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.key}>
                <td className={row.winner === 'left' ? 'is-winner' : undefined}>{numberFormat.format(row.left)}</td>
                <th scope="row">{t.compareLabels[row.key] ?? row.label}</th>
                <td className={row.winner === 'right' ? 'is-winner' : undefined}>{numberFormat.format(row.right)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Link className="duel-board__home" to="/">{t.newDuel}</Link>
      </section>
    </main>
  )
}

export default ComparePage
