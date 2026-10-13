import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { useLang, useStrings } from '../i18n/useLang'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CityError, fetchCity } from '../lib/api'
import { cityLayout } from '../lib/cityLayout'
import { cityStats } from '../lib/cityStats'
import { readCityParams, writeCityParams } from '../lib/cityParams'
import { builtBy, timelineRange } from '../lib/timeline'
import { EXAMPLE_CITY } from '../lib/exampleCity'
import type { ApiErrorCode, CityResponse, Repo } from '../lib/types'
import CityScene from '../scene/LazyCityScene'
import BadgePopover from '../ui/BadgePopover'
import CompareForm from '../ui/CompareForm'
import RepoFinder from '../ui/RepoFinder'
import ShortcutsHelp from '../ui/ShortcutsHelp'
import Timeline from '../ui/Timeline'
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
  const t = useStrings()
  const lang = useLang()
  const [visibleYear, setVisibleYear] = useState<number | null>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [retryCount, setRetryCount] = useState<number>(0)
  const [sceneAttempt, setSceneAttempt] = useState<number>(0)
  const loadingBuildings = useMemo(() => cityLayout(EXAMPLE_CITY.repos, now), [now])

  const userPickedTime = useRef(false)
  const handleToggleTime = useCallback((): void => {
    userPickedTime.current = true
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

  // Shared links: ?repo=…&year=… reopen the same building and moment once the city arrives.
  const initialParams = useRef(new URLSearchParams(window.location.search))
  const restoredParams = useRef(false)
  const restoreSharedView = useCallback((data: CityResponse): void => {
    restoredParams.current = true
    const years = data.repos.map((repo) => ({ createdYear: new Date(repo.createdAt).getUTCFullYear() }))
    const { repo, year } = readCityParams(initialParams.current, data.repos, timelineRange(years, now))
    if (year !== null) {
      setVisibleYear(year)
    }
    const sharedRepo = data.repos.find(({ name }) => name === repo)
    if (sharedRepo !== undefined) {
      setInteractionState((current) => ({ ...current, selectedRepo: sharedRepo }))
    }
  }, [now])

  useEffect(() => {
    if (user === undefined) {
      return
    }

    let isCurrentRequest = true

    void fetchCity(user, fetch)
      .then((data) => {
        if (isCurrentRequest) {
          setRequestState({ user, state: { status: 'ok', data } })
          restoreSharedView(data)
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
  }, [restoreSharedView, retryCount, user])

  const isReady = requestState.user === user && requestState.state.status === 'ok'
  // Nightfall during the opening fly-in: the city lights up as the camera arrives.
  useEffect(() => {
    if (!isReady) {
      return
    }
    const timeout = window.setTimeout(() => {
      if (!userPickedTime.current) {
        setTimeOfDay(1)
      }
    }, 1800)
    return () => window.clearTimeout(timeout)
  }, [isReady])

  const state: PageState = requestState.user === user
    ? requestState.state
    : { status: 'loading' }
  const data = state.status === 'ok' ? state.data : null
  const buildings = useMemo(
    () => data === null ? [] : cityLayout(data.repos, now),
    [data, now],
  )
  const stats = useMemo(() => (data === null ? null : cityStats(data.repos, now)), [data, now])
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

  const [finderOpen, setFinderOpen] = useState(false)
  const [duelOpen, setDuelOpen] = useState(false)
  const [badgeOpen, setBadgeOpen] = useState(false)
  const range = useMemo(() => timelineRange(buildings, now), [buildings, now])
  const [searchParams, setSearchParams] = useSearchParams()

  // ...and keep the URL in sync so the copy-link button shares exactly this view.
  const selectedName = interactionState.selectedRepo?.name ?? null
  useEffect(() => {
    if (!restoredParams.current) {
      return
    }
    const next = writeCityParams({ repo: selectedName, year: visibleYear })
    // Keep the language in shared links so an English visitor shares the English city.
    if (lang === 'en') {
      next.set('lang', 'en')
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [lang, searchParams, selectedName, setSearchParams, visibleYear])
  const handleFinderSelect = useCallback((repo: Repo): void => {
    setFinderOpen(false)
    setInteractionState((current) => ({ ...current, selectedRepo: repo }))
  }, [])

  // "/" opens the building finder (like search on GitHub) and "?" the shortcuts help.
  const [helpOpen, setHelpOpen] = useState(false)
  useEffect(() => {
    const handleKey = (event: globalThis.KeyboardEvent): void => {
      const typing = event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)
      if (typing || !isReady) {
        return
      }
      if (event.key === '/') {
        event.preventDefault()
        setFinderOpen(true)
      } else if (event.key === '?') {
        event.preventDefault()
        setHelpOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isReady])

  const handleCloseRepo = useCallback((): void => {
    setInteractionState((current) => ({ ...current, selectedRepo: null }))
  }, [])

  const focusIndex = interaction.selectedRepo === null
    ? null
    : buildings.findIndex((building) => building.repoName === interaction.selectedRepo?.name)

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
              <p>{t.sceneUnavailable}</p>
              <button type="button" onClick={handleSceneRetry}>{t.retryScene}</button>
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
              showLandmark={false}
            />
            <StatusScreen role="status"><p>{t.loadingCity}</p></StatusScreen>
          </>
        </SceneErrorBoundary>
      )}
      {state.status === 'error' && (
        <StatusScreen role="alert">
          {state.code === 'RATE_LIMITED' && <p>{t.rateLimited}</p>}
          {state.code === 'UPSTREAM_ERROR' && <p>{t.upstreamError}</p>}
          {state.code === 'INVALID_USERNAME' && <p>{t.invalidUserLong}</p>}
          {state.code === 'INVALID_USERNAME'
            ? <SearchBar />
            : <button type="button" onClick={handleRetry}>{t.retry}</button>}
          {state.code === 'INVALID_USERNAME' && <Link to="/">{t.backHome}</Link>}
        </StatusScreen>
      )}
      {state.status === 'ok' && (
        <>
          <SceneErrorBoundary
            key={`ready:${sceneAttempt}`}
            onError={() => setCanvas(null)}
            fallback={(
              <StatusScreen role="alert">
                <p>{t.sceneUnavailable}</p>
                <button type="button" onClick={handleSceneRetry}>{t.retryScene}</button>
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
              intro
              focusIndex={focusIndex === -1 ? null : focusIndex}
              visibleYear={visibleYear}
            />
          </SceneErrorBoundary>
          <Toolbar canvas={canvasForCapture(state.status, canvas)} login={state.data.user.login} timeOfDay={timeOfDay} onToggleTime={handleToggleTime} onOpenFinder={() => setFinderOpen(true)} onOpenDuel={() => {
              setBadgeOpen(false)
              setDuelOpen((open) => !open)
            }}
            onOpenBadge={() => {
              setDuelOpen(false)
              setBadgeOpen((open) => !open)
            }}
          />
          {badgeOpen && <BadgePopover login={state.data.user.login} />}
          {duelOpen && (
            <div className="duel-popover" role="dialog" aria-label="Duelo de ciudades">
              <p>{t.challenge}</p>
              <CompareForm left={state.data.user.login} compact />
            </div>
          )}
          {range !== null && (
            <Timeline
              range={range}
              year={visibleYear}
              builtCount={visibleYear === null ? buildings.length : builtBy(buildings, visibleYear)}
              total={buildings.length}
              onChange={setVisibleYear}
            />
          )}
          {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}
          {finderOpen && (
            <RepoFinder repos={state.data.repos} onSelect={handleFinderSelect} onClose={() => setFinderOpen(false)} />
          )}
          {state.data.repos.length === 0 && (
            <StatusScreen role="status"><p>{t.emptyCity}</p></StatusScreen>
          )}
          <UserCard
            user={state.data.user}
            repositoryCount={state.data.repos.length}
            totalContributions={state.data.activity.totalContributions}
            stats={stats ?? cityStats([], now)}
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

  // Keyed by user only: ?repo/?year changes are in-page state, not a new city.
  return <CityPageContent key={user ?? ''} user={user} />
}

export default CityPage
