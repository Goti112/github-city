import { useState, type ReactElement } from 'react'
import { badgeMarkdown } from '../lib/badge'

type BadgePopoverProps = {
  login: string
}

// "Put your city on your GitHub profile": badge preview plus copy-ready Markdown.
const BadgePopover = ({ login }: BadgePopoverProps): ReactElement => {
  const origin = window.location.origin
  const markdown = badgeMarkdown(login, origin)
  const [copied, setCopied] = useState<'idle' | 'ok' | 'error'>('idle')

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied('ok')
    } catch {
      setCopied('error')
    }
  }

  return (
    <div className="badge-popover" role="dialog" aria-label="Badge para tu README">
      <p className="badge-popover__title">Pon tu ciudad en tu perfil de GitHub</p>
      <img src={`${origin}/api/badge/${login}`} alt={`Badge de GitHub City de ${login}`} height={20} />
      <label className="badge-popover__label" htmlFor="badge-markdown">Pega esto en tu README:</label>
      <textarea id="badge-markdown" readOnly rows={3} value={markdown} onFocus={(event) => event.currentTarget.select()} />
      <button type="button" onClick={() => void handleCopy()}>
        {copied === 'ok' ? '¡Copiado!' : 'Copiar Markdown'}
      </button>
      {copied === 'error' && <p className="badge-popover__error" role="alert">No se pudo copiar: selecciona el texto y cópialo a mano.</p>}
    </div>
  )
}

export default BadgePopover
