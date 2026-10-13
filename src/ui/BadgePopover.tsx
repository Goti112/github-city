import { useState, type ReactElement } from 'react'
import { useStrings } from '../i18n/useLang'
import { badgeMarkdown } from '../lib/badge'

type BadgePopoverProps = {
  login: string
}

// "Put your city on your GitHub profile": badge preview plus copy-ready Markdown.
const BadgePopover = ({ login }: BadgePopoverProps): ReactElement => {
  const t = useStrings()
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
    <div className="badge-popover" role="dialog" aria-label={t.badgeDialog}>
      <p className="badge-popover__title">{t.badgeTitle}</p>
      <img src={`${origin}/api/badge/${login}`} alt={`Badge de GitHub City de ${login}`} height={20} />
      <label className="badge-popover__label" htmlFor="badge-markdown">{t.badgePaste}</label>
      <textarea id="badge-markdown" readOnly rows={3} value={markdown} onFocus={(event) => event.currentTarget.select()} />
      <button type="button" onClick={() => void handleCopy()}>
        {copied === 'ok' ? t.badgeCopied : t.badgeCopy}
      </button>
      {copied === 'error' && <p className="badge-popover__error" role="alert">{t.badgeCopyError}</p>}
    </div>
  )
}

export default BadgePopover
