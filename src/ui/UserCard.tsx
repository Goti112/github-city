import type { ReactElement } from 'react'
import { useCityTitle, useStrings } from '../i18n/useLang'
import type { CityStats } from '../lib/cityStats'
import type { CityResponse } from '../lib/types'
import LangSwitch from './LangSwitch'

type UserCardProps = {
  user: CityResponse['user']
  repositoryCount: number
  totalContributions: number
  stats: CityStats
}

const numberFormat = new Intl.NumberFormat('es')
const percentFormat = new Intl.NumberFormat('es', { style: 'percent', maximumFractionDigits: 0 })

const UserCard = ({ user, repositoryCount, totalContributions, stats }: UserCardProps): ReactElement => {
  const t = useStrings()
  const title = useCityTitle(stats.title)
  return (
  <section className="user-card" aria-label={`Perfil de GitHub de ${user.login}`}>
    <div className="user-card__header">
      <img className="user-card__avatar" src={user.avatarUrl} alt={`Avatar de ${user.login}`} />
      <div className="user-card__content">
        <LangSwitch className="user-card__lang" />
        <p className="user-card__eyebrow">GitHub City · <span>{title}</span></p>
        <h1 className="user-card__name">{user.name ?? user.login}</h1>
        <p className="user-card__login">@{user.login}</p>
      </div>
    </div>
    <dl className="user-card__stats">
      <div>
        <dt>{t.buildings}</dt>
        <dd>{numberFormat.format(repositoryCount)}</dd>
      </div>
      <div>
        <dt>{t.population}</dt>
        <dd title={t.populationHint}>{numberFormat.format(stats.population)}</dd>
      </div>
      <div className="user-card__stat--extra">
        <dt>{t.districts}</dt>
        <dd>{numberFormat.format(stats.districts)}</dd>
      </div>
      <div className="user-card__stat--extra">
        <dt>{t.lit}</dt>
        <dd title={t.litHint}>{numberFormat.format(stats.litBuildings)}</dd>
      </div>
      <div className="user-card__stat--extra">
        <dt>{t.stars}</dt>
        <dd>{numberFormat.format(stats.stars)}</dd>
      </div>
      <div className="user-card__stat--extra">
        <dt>{t.contributions}</dt>
        <dd>{numberFormat.format(totalContributions)}</dd>
      </div>
    </dl>
    {(stats.tallest !== null || stats.topLanguage !== null) && (
      <ul className="user-card__facts">
        {stats.tallest !== null && (
          <li>
            <span aria-hidden="true">🏙️</span> {t.skyscraper}: <strong>{stats.tallest.name}</strong>
            {' '}({numberFormat.format(stats.tallest.commits)} commits)
          </li>
        )}
        {stats.topLanguage !== null && (
          <li>
            <span aria-hidden="true">🗺️</span> {t.mainDistrict}: <strong>{stats.topLanguage.name}</strong>
            {' '}({percentFormat.format(stats.topLanguage.share)} {t.ofTheCity})
          </li>
        )}
      </ul>
    )}
  </section>
  )
}

export default UserCard
