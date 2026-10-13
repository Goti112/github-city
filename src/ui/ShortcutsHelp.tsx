import { useEffect, useRef, type ReactElement } from 'react'

type ShortcutsHelpProps = {
  onClose: () => void
}

const shortcuts: Array<[string, string]> = [
  ['/', 'Buscar un edificio'],
  ['Esc', 'Cerrar panel o buscador'],
  ['?', 'Mostrar u ocultar esta ayuda'],
  ['Arrastrar', 'Girar la ciudad'],
  ['Rueda / pellizco', 'Acercar y alejar'],
  ['Clic en un edificio', 'Volar hasta él y ver su repo'],
]

const ShortcutsHelp = ({ onClose }: ShortcutsHelpProps): ReactElement => {
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
        <h2 id="shortcuts-help-title">Cómo moverte por la ciudad</h2>
        <button ref={closeRef} type="button" aria-label="Cerrar la ayuda" onClick={onClose}>×</button>
      </div>
      <dl>
        {shortcuts.map(([keys, action]) => (
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
