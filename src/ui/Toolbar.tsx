import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { useStrings } from '../i18n/useLang'
import { captureCity } from './screenshot'

type ToolbarProps = {
  canvas: HTMLCanvasElement | null
  login: string
  timeOfDay: number
  onToggleTime: () => void
  onOpenFinder: () => void
  onOpenDuel: () => void
  onOpenBadge: () => void
}

const Toolbar = ({ canvas, login, timeOfDay, onToggleTime, onOpenFinder, onOpenDuel, onOpenBadge }: ToolbarProps): ReactElement => {
  const [message, setMessage] = useState<string | null>(null)
  const messageTimeout = useRef<number | null>(null)
  const isNight = timeOfDay >= 0.75
  const t = useStrings()

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
      showMessage(t.captureDone, 2000)
    } catch (error: unknown) {
      console.error('No se pudo descargar la captura de la ciudad', { error, login })
      showMessage(t.captureError, 4000)
    }
  }, [canvas, login, showMessage, t])

  const handleCopyLink = useCallback(async (): Promise<void> => {
    const url = window.location.href
    // Phones get the native share sheet (WhatsApp, LinkedIn…); desktops copy the link.
    if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: `La ciudad de @${login} · GitHub City`, url })
        return
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return // the user closed the share sheet
        }
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      showMessage(t.linkCopied, 2000)
    } catch (error: unknown) {
      console.error('No se pudo copiar el enlace de la ciudad', { error, login })
      showMessage(t.linkError, 4000)
    }
  }, [login, showMessage, t])

  return (
    <div className="city-toolbar" role="group" aria-label={t.toolbarGroup}>
      <button type="button" aria-label={t.findButton} title={t.findTitle} onClick={onOpenFinder}>
        🔍
      </button>
      <button type="button" aria-label={t.badgeButton} title={t.badgeDialog} onClick={onOpenBadge}>
        📛
      </button>
      <button type="button" aria-label={t.duelButtonLabel} title={t.duelHeading} onClick={onOpenDuel}>
        ⚔️
      </button>
      <button
        type="button"
        aria-label={isNight ? t.toDay : t.toNight}
        onClick={onToggleTime}
      >
        {isNight ? t.day : t.night}
      </button>
      <button type="button" aria-label={t.capture} disabled={canvas === null} onClick={() => void handleCapture()}>
        📸
      </button>
      <button type="button" aria-label={t.share} onClick={() => void handleCopyLink()}>
        🔗
      </button>
      {message !== null && <p className="city-toolbar__message" role="status">{message}</p>}
    </div>
  )
}

export default Toolbar
