import type { ReactElement } from 'react'
import type { CityResponse } from '../lib/types'

type UserCardProps = {
  user: CityResponse['user']
  repositoryCount: number
  totalContributions: number
}

const numberFormat = new Intl.NumberFormat('es')

const UserCard = ({ user, repositoryCount, totalContributions }: UserCardProps): ReactElement => (
  <section className="user-card" aria-label={`Perfil de GitHub de ${user.login}`}>
    <img className="user-card__avatar" src={user.avatarUrl} alt={`Avatar de ${user.login}`} />
    <div className="user-card__content">
      <p className="user-card__eyebrow">GitHub City</p>
      <h1 className="user-card__name">{user.name ?? user.login}</h1>
      <p className="user-card__login">@{user.login}</p>
      <dl className="user-card__stats">
        <div>
          <dt>Repos públicos</dt>
          <dd>{numberFormat.format(repositoryCount)}</dd>
        </div>
        <div>
          <dt>Contribuciones este año</dt>
          <dd>{numberFormat.format(totalContributions)}</dd>
        </div>
      </dl>
    </div>
  </section>
)

export default UserCard
