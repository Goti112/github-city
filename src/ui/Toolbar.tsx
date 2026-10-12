import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { captureCity } from './screenshot'

type ToolbarProps = {
  canvas: HTMLCanvasElement | null
  login: string
  timeOfDay: number
  onToggleTime: () => void
  onOpenFinder: () => void
  onOpenDuel: () => void
}

const Toolbar = ({ canvas, login, timeOfDay, onToggleTime, onOpenFinder, onOpenDuel }: ToolbarProps): ReactElement => {
  const [message, setMessage] = useState<string | null>(null)
  const messageTimeout = useRef<number | null>(null)
  const isNight = timeOfDay >= 0.75

  const showMessage = useCallback((nextMessage: string, duration: number): void => {
    if (messageTimeout.current !== null) {
      window.clearTimeout(messageTimeout.current)
    }

    setMessage(nextMessage)
    messageTimeout.current = window.setTimeout(() => {
      setMessage(null)
      messageTimeout.current = null
    }, duration)
  }, [])

  useEffect(() => () => {
    if (messageTimeout.current !== null) {
      window.clearTimeout(messageTimeout.current)
    }
  }, [])

  const handleCapture = useCallback(async (): Promise<void> => {
    try {
      if (canvas === null) {
        throw new Error(`La escena de @${login} todavía no tiene un canvas disponible`)
      }

      const blob = await captureCity(canvas, login)
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `github-city-${login}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      showMessage('Captura descargada.', 2000)
    } catch (error: unknown) {
      console.error('No se pudo descargar la captura de la ciudad', { error, login })
      showMessage('No se pudo generar la captura. Inténtalo de nuevo.', 4000)
    }
  }, [canvas, login, showMessage])

  const handleCopyLink = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showMessage('¡Enlace copiado!', 2000)
    } catch (error: unknown) {
      console.error('No se pudo copiar el enlace de la ciudad', { error, login })
      showMessage('No se pudo copiar el enlace. Revisa los permisos del navegador.', 4000)
    }
  }, [login, showMessage])

  return (
    <div className="city-toolbar" role="group" aria-label="Acciones de la ciudad">
      <button type="button" aria-label="Buscar un edificio (atajo: /)" title="Buscar un edificio (/)" onClick={onOpenFinder}>
        🔍
      </button>
      <button type="button" aria-label="Retar a otro perfil a un duelo" title="Duelo de ciudades" onClick={onOpenDuel}>
        ⚔️
      </button>
      <button
        type="button"
        aria-label={isNight ? 'Cambiar a día' : 'Cambiar a noche'}
        onClick={onToggleTime}
      >
        {isNight ? '☀️ Día' : '🌙 Noche'}
      </button>
      <button type="button" aria-label="Descargar captura PNG" disabled={canvas === null} onClick={() => void handleCapture()}>
        📸
      </button>
      <button type="button" aria-label="Copiar enlace de la ciudad" onClick={() => void handleCopyLink()}>
        🔗
      </button>
      {message !== null && <p className="city-toolbar__message" role="status">{message}</p>}
    </div>
  )
}

export default Toolbar
