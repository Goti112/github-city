import { useEffect, useRef, type ReactElement } from 'react'
import { useStrings } from '../i18n/useLang'

type ShortcutsHelpProps = {
  onClose: () => void
}

const ShortcutsHelp = ({ onClose }: ShortcutsHelpProps): ReactElement => {
  const t = useStrings()
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="shortcuts-help" role="dialog" aria-modal="false" aria-labelledby="shortcuts-help-title">
      <div className="shortcuts-help__header">
        <h2 id="shortcuts-help-title">{t.helpTitle}</h2>
        <button ref={closeRef} type="button" aria-label={t.closeHelp} onClick={onClose}>×</button>
      </div>
      <dl>
        {t.shortcuts.map(([keys, action]) => (
          <div key={keys}>
            <dt><kbd>{keys}</kbd></dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default ShortcutsHelp
