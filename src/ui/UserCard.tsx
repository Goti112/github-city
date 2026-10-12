import type { ReactElement } from 'react'
import type { CityStats } from '../lib/cityStats'
import type { CityResponse } from '../lib/types'

type UserCardProps = {
  user: CityResponse['user']
  repositoryCount: number
  totalContributions: number
  stats: CityStats
}

const numberFormat = new Intl.NumberFormat('es')
const percentFormat = new Intl.NumberFormat('es', { style: 'percent', maximumFractionDigits: 0 })

const UserCard = ({ user, repositoryCount, totalContributions, stats }: UserCardProps): ReactElement => (
  <section className="user-card" aria-label={`Perfil de GitHub de ${user.login}`}>
    <div className="user-card__header">
      <img className="user-card__avatar" src={user.avatarUrl} alt={`Avatar de ${user.login}`} />
      <div className="user-card__content">
        <p className="user-card__eyebrow">GitHub City · <span>{stats.title}</span></p>
        <h1 className="user-card__name">{user.name ?? user.login}</h1>
        <p className="user-card__login">@{user.login}</p>
      </div>
    </div>
    <dl className="user-card__stats">
      <div>
        <dt>Edificios</dt>
        <dd>{numberFormat.format(repositoryCount)}</dd>
      </div>
      <div>
        <dt>Habitantes</dt>
        <dd title="Commits en las ramas principales">{numberFormat.format(stats.population)}</dd>
      </div>
      <div className="user-card__stat--extra">
        <dt>Distritos</dt>
        <dd>{numberFormat.format(stats.districts)}</dd>
      </div>
      <div className="user-card__stat--extra">
        <dt>Encendidos</dt>
        <dd title="Repos con actividad en los últimos 30 días">{numberFormat.format(stats.litBuildings)}</dd>
      </div>
      <div className="user-card__stat--extra">
        <dt>Estrellas</dt>
        <dd>{numberFormat.format(stats.stars)}</dd>
      </div>
      <div className="user-card__stat--extra">
        <dt>Aportes / año</dt>
        <dd>{numberFormat.format(totalContributions)}</dd>
      </div>
    </dl>
    {(stats.tallest !== null || stats.topLanguage !== null) && (
      <ul className="user-card__facts">
        {stats.tallest !== null && (
          <li>
            <span aria-hidden="true">🏙️</span> Rascacielos: <strong>{stats.tallest.name}</strong>
            {' '}({numberFormat.format(stats.tallest.commits)} commits)
          </li>
        )}
        {stats.topLanguage !== null && (
          <li>
            <span aria-hidden="true">🗺️</span> Barrio principal: <strong>{stats.topLanguage.name}</strong>
            {' '}({percentFormat.format(stats.topLanguage.share)} de la ciudad)
          </li>
        )}
      </ul>
    )}
  </section>
)

export default UserCard
