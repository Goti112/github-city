import { useEffect, useState } from 'react'
import { CityError, fetchCity } from './api'
import type { ApiErrorCode, CityResponse } from './types'

export type CityState =
  | { status: 'loading' }
  | { status: 'error'; code: ApiErrorCode }
  | { status: 'ok'; data: CityResponse }

// Loads one city; stale responses (after the user changes) are ignored.
export const useCity = (user: string): CityState => {
  const [state, setState] = useState<{ user: string; value: CityState }>({ user, value: { status: 'loading' } })

  useEffect(() => {
    let current = true
    fetchCity(user, fetch)
      .then((data) => current && setState({ user, value: { status: 'ok', data } }))
      .catch((error: unknown) => {
        if (current) {
          setState({ user, value: { status: 'error', code: error instanceof CityError ? error.code : 'UPSTREAM_ERROR' } })
        }
      })
    return () => {
      current = false
    }
  }, [user])

  return state.user === user ? state.value : { status: 'loading' }
}
