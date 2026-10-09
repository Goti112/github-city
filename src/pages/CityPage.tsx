import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { useParams } from 'react-router-dom'
import { CityError, fetchCity } from '../lib/api'
import { cityLayout } from '../lib/cityLayout'
import type { ApiErrorCode, CityResponse } from '../lib/types'
import NotFound from './NotFound'

type PageState =
  | { status: 'loading' }
  | { status: 'error'; code: ApiErrorCode }
  | { status: 'ok'; data: CityResponse }

type RequestState = {
  user: string | undefined
  state: PageState
}

const CityPage = (): ReactElement => {
  const { user } = useParams()
  const [requestState, setRequestState] = useState<RequestState>(() => ({
    user,
    state: { status: 'loading' },
  }))
  const [now] = useState<Date>(() => new Date())

  useEffect(() => {
    if (user === undefined) {
      return
    }

    let isCurrentRequest = true

    void fetchCity(user, fetch)
      .then((data) => {
        if (isCurrentRequest) {
          setRequestState({ user, state: { status: 'ok', data } })
        }
      })
      .catch((error: unknown) => {
        if (isCurrentRequest) {
          const code = error instanceof CityError ? error.code : 'UPSTREAM_ERROR'
          setRequestState({ user, state: { status: 'error', code } })
        }
      })

    return () => {
      isCurrentRequest = false
    }
  }, [user])

  const state: PageState = requestState.user === user
    ? requestState.state
    : { status: 'loading' }
  const data = state.status === 'ok' ? state.data : null
  const buildings = useMemo(
    () => data === null ? [] : cityLayout(data.repos, now),
    [data, now],
  )

  if (user === undefined) {
    return <NotFound />
  }

  return (
    <main className="city-page">
      {state.status === 'loading' && (
        <p className="city-page__status" role="status">Cargando la ciudad de @{user}…</p>
      )}
      {state.status === 'error' && (
        <p className="city-page__status" role="alert">
          No se pudo cargar la ciudad de @{user}. Código: {state.code}
        </p>
      )}
      {state.status === 'ok' && (
        <section className="city-page__summary" aria-live="polite">
          <img src={state.data.user.avatarUrl} alt="" />
          <div>
            <h1>{state.data.user.name ?? state.data.user.login}</h1>
            <p>@{state.data.user.login}</p>
            <p>{buildings.length} edificios preparados</p>
          </div>
        </section>
      )}
    </main>
  )
}

export default CityPage
