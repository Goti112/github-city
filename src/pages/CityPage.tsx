import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'
import { useParams } from 'react-router-dom'
import { CityError, fetchCity } from '../lib/api'
import { cityLayout } from '../lib/cityLayout'
import type { ApiErrorCode, CityResponse, Repo } from '../lib/types'
import CityScene from '../scene/CityScene'
import RepoPanel from '../ui/RepoPanel'
import Tooltip, { type PointerPosition } from '../ui/Tooltip'
import UserCard from '../ui/UserCard'
import NotFound from './NotFound'

type PageState =
  | { status: 'loading' }
  | { status: 'error'; code: ApiErrorCode }
  | { status: 'ok'; data: CityResponse }

type RequestState = {
  user: string | undefined
  state: PageState
}

type InteractionState = {
  user: string | undefined
  hoveredIndex: number | null
  pointerPosition: PointerPosition | null
  selectedRepo: Repo | null
}

const CityPage = (): ReactElement => {
  const { user } = useParams()
  const [requestState, setRequestState] = useState<RequestState>(() => ({
    user,
    state: { status: 'loading' },
  }))
  const [now] = useState<Date>(() => new Date())
  const [interactionState, setInteractionState] = useState<InteractionState>(() => ({
    user,
    hoveredIndex: null,
    pointerPosition: null,
    selectedRepo: null,
  }))

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
  const interaction: InteractionState = interactionState.user === user
    ? interactionState
    : { user, hoveredIndex: null, pointerPosition: null, selectedRepo: null }

  const handleHover = useCallback((
    hoveredIndex: number | null,
    pointerPosition: PointerPosition | null,
  ): void => {
    if ((hoveredIndex === null) !== (pointerPosition === null)) {
      throw new TypeError('El índice y la posición del hover deben estar activos o vacíos a la vez')
    }
    if (hoveredIndex !== null && buildings[hoveredIndex] === undefined) {
      throw new RangeError(`Índice de edificio fuera de rango: ${hoveredIndex}; edificios: ${buildings.length}`)
    }

    setInteractionState((current) => {
      const selectedRepo = current.user === user ? current.selectedRepo : null
      const samePosition = current.pointerPosition?.x === pointerPosition?.x
        && current.pointerPosition?.y === pointerPosition?.y
      if (
        current.user === user
        && current.hoveredIndex === hoveredIndex
        && samePosition
        && current.selectedRepo === selectedRepo
      ) {
        return current
      }

      return { user, hoveredIndex, pointerPosition, selectedRepo }
    })
  }, [buildings, user])

  const handleSelect = useCallback((index: number): void => {
    const building = buildings[index]
    if (building === undefined) {
      throw new RangeError(`Índice de edificio fuera de rango: ${index}; edificios: ${buildings.length}`)
    }
    if (data === null) {
      throw new Error(`No se puede seleccionar ${building.repoName} antes de cargar los datos de @${user}`)
    }

    const repo = data.repos.find(({ name }) => name === building.repoName)
    if (repo === undefined) {
      throw new Error(`No se encontró el repositorio ${building.repoName} en los datos de @${user}`)
    }

    setInteractionState((current) => ({
      user,
      hoveredIndex: current.user === user ? current.hoveredIndex : null,
      pointerPosition: current.user === user ? current.pointerPosition : null,
      selectedRepo: repo,
    }))
  }, [buildings, data, user])

  const handleCloseRepo = useCallback((): void => {
    setInteractionState((current) => ({
      user,
      hoveredIndex: current.user === user ? current.hoveredIndex : null,
      pointerPosition: current.user === user ? current.pointerPosition : null,
      selectedRepo: null,
    }))
  }, [user])

  const hoveredBuildingName = interaction.hoveredIndex === null
    ? null
    : buildings[interaction.hoveredIndex]?.repoName ?? null

  if (user === undefined) {
    return <NotFound />
  }

  return (
    <main className={`city-page${interaction.hoveredIndex === null ? '' : ' city-page--hovered'}`}>
      {state.status === 'loading' && (
        <p className="city-page__status" role="status">Cargando la ciudad de @{user}…</p>
      )}
      {state.status === 'error' && (
        <p className="city-page__status" role="alert">
          No se pudo cargar la ciudad de @{user}. Código: {state.code}
        </p>
      )}
      {state.status === 'ok' && (
        <>
          <CityScene
            buildings={buildings}
            avatarUrl={state.data.user.avatarUrl}
            hovered={interaction.hoveredIndex}
            onHover={handleHover}
            onSelect={handleSelect}
          />
          <UserCard
            user={state.data.user}
            repositoryCount={state.data.repos.length}
            totalContributions={state.data.activity.totalContributions}
          />
          {hoveredBuildingName !== null && interaction.pointerPosition !== null && (
            <Tooltip label={hoveredBuildingName} position={interaction.pointerPosition} />
          )}
          {interaction.selectedRepo !== null && (
            <RepoPanel repo={interaction.selectedRepo} onClose={handleCloseRepo} />
          )}
        </>
      )}
    </main>
  )
}

export default CityPage
