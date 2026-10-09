import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { CityError, fetchCity } from '../lib/api'
import { cityLayout } from '../lib/cityLayout'
import { EXAMPLE_CITY } from '../lib/exampleCity'
import type { ApiErrorCode, CityResponse, Repo } from '../lib/types'
import CityScene from '../scene/CityScene'
import RepoPanel from '../ui/RepoPanel'
import SearchBar from '../ui/SearchBar'
import StatusScreen from '../ui/StatusScreen'
import Toolbar from '../ui/Toolbar'
import Tooltip, { type PointerPosition } from '../ui/Tooltip'
import UserCard from '../ui/UserCard'
import { canvasForCapture } from '../ui/canvasForCapture'
import { SceneErrorBoundary } from '../ui/SceneErrorBoundary'
import NotFound, { UserNotFound } from './NotFound'

type PageState =
  | { status: 'loading' }
  | { status: 'error'; code: ApiErrorCode }
  | { status: 'ok'; data: CityResponse }

type RequestState = {
  user: string | undefined
  state: PageState
}

type InteractionState = {
  hoveredIndex: number | null
  pointerPosition: PointerPosition | null
  selectedRepo: Repo | null
}

type CityPageContentProps = {
  user: string | undefined
}

const CityPageContent = ({ user }: CityPageContentProps): ReactElement => {
  const [requestState, setRequestState] = useState<RequestState>(() => ({
    user,
    state: { status: 'loading' },
  }))
  const [now] = useState<Date>(() => new Date())
  const [interactionState, setInteractionState] = useState<InteractionState>(() => ({
    hoveredIndex: null,
    pointerPosition: null,
    selectedRepo: null,
  }))
  const [timeOfDay, setTimeOfDay] = useState<number>(0.5)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [retryCount, setRetryCount] = useState<number>(0)
  const [sceneAttempt, setSceneAttempt] = useState<number>(0)
  const loadingBuildings = useMemo(() => cityLayout(EXAMPLE_CITY.repos, now), [now])

  const handleToggleTime = useCallback((): void => {
    setTimeOfDay((current) => current === 1 ? 0 : 1)
  }, [])
  const handleCanvasReady = useCallback((nextCanvas: HTMLCanvasElement): void => {
    setCanvas(nextCanvas)
  }, [])
  const handleRetry = useCallback((): void => {
    setCanvas(null)
    setRequestState({ user, state: { status: 'loading' } })
    setRetryCount((current) => current + 1)
  }, [user])
  const handleSceneRetry = useCallback((): void => {
    setCanvas(null)
    setSceneAttempt((current) => current + 1)
  }, [])

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
  }, [retryCount, user])

  const state: PageState = requestState.user === user
    ? requestState.state
    : { status: 'loading' }
  const data = state.status === 'ok' ? state.data : null
  const buildings = useMemo(
    () => data === null ? [] : cityLayout(data.repos, now),
    [data, now],
  )
  const interaction = interactionState

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
      const samePosition = current.pointerPosition?.x === pointerPosition?.x
        && current.pointerPosition?.y === pointerPosition?.y
      if (
        current.hoveredIndex === hoveredIndex
        && samePosition
      ) {
        return current
      }

      return { ...current, hoveredIndex, pointerPosition }
    })
  }, [buildings])

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

    setInteractionState((current) => ({ ...current, selectedRepo: repo }))
  }, [buildings, data, user])

  const handleCloseRepo = useCallback((): void => {
    setInteractionState((current) => ({ ...current, selectedRepo: null }))
  }, [])

  const hoveredBuildingName = interaction.hoveredIndex === null
    ? null
    : buildings[interaction.hoveredIndex]?.repoName ?? null

  if (user === undefined) {
    return <NotFound />
  }

  if (state.status === 'error' && state.code === 'USER_NOT_FOUND') {
    return <UserNotFound />
  }

  return (
    <main className={`city-page${interaction.hoveredIndex === null ? '' : ' city-page--hovered'}`}>
      {state.status === 'loading' && (
        <SceneErrorBoundary
          key={`loading:${sceneAttempt}`}
          fallback={(
            <StatusScreen role="alert">
              <p>La escena 3D no está disponible.</p>
              <button type="button" onClick={handleSceneRetry}>Reintentar escena</button>
            </StatusScreen>
          )}
        >
          <>
            <CityScene
              buildings={loadingBuildings}
              avatarUrl={EXAMPLE_CITY.user.avatarUrl}
              timeOfDay={timeOfDay}
              hovered={null}
              autoRotateSpeed={0}
            />
            <StatusScreen role="status"><p>Levantando tu ciudad…</p></StatusScreen>
          </>
        </SceneErrorBoundary>
      )}
      {state.status === 'error' && (
        <StatusScreen role="alert">
          {state.code === 'RATE_LIMITED' && <p>GitHub nos pide un respiro. Prueba en un minuto.</p>}
          {state.code === 'UPSTREAM_ERROR' && <p>Algo ha fallado al hablar con GitHub.</p>}
          {state.code === 'INVALID_USERNAME' && <p>Ese nombre de usuario no es válido.</p>}
          {state.code === 'INVALID_USERNAME'
            ? <SearchBar />
            : <button type="button" onClick={handleRetry}>Reintentar</button>}
          {state.code === 'INVALID_USERNAME' && <Link to="/">Volver al inicio</Link>}
        </StatusScreen>
      )}
      {state.status === 'ok' && (
        <>
          <SceneErrorBoundary
            key={`ready:${sceneAttempt}`}
            onError={() => setCanvas(null)}
            fallback={(
              <StatusScreen role="alert">
                <p>La escena 3D no está disponible.</p>
                <button type="button" onClick={handleSceneRetry}>Reintentar escena</button>
              </StatusScreen>
            )}
          >
            <CityScene
              buildings={buildings}
              avatarUrl={state.data.user.avatarUrl}
              timeOfDay={timeOfDay}
              hovered={interaction.hoveredIndex}
              onHover={handleHover}
              onSelect={handleSelect}
              onCanvasReady={handleCanvasReady}
              autoRotateSpeed={0}
            />
          </SceneErrorBoundary>
          <Toolbar canvas={canvasForCapture(state.status, canvas)} login={state.data.user.login} timeOfDay={timeOfDay} onToggleTime={handleToggleTime} />
          {state.data.repos.length === 0 && (
            <StatusScreen role="status"><p>🚧 En obras: aún no hay repos públicos</p></StatusScreen>
          )}
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

const CityPage = (): ReactElement => {
  const { user } = useParams()
  const location = useLocation()

  return <CityPageContent key={`${location.key}:${user ?? ''}`} user={user} />
}

export default CityPage
