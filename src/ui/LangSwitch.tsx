import type { ReactElement } from 'react'
import { setLang, useLang, useStrings } from '../i18n/useLang'

// ES / EN toggle; Spanish stays the default.
const LangSwitch = ({ className = '' }: { className?: string }): ReactElement => {
  const lang = useLang()
  const t = useStrings()
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t.language}>
      {(['es', 'en'] as const).map((option) => (
        <button key={option} type="button" aria-pressed={lang === option} onClick={() => setLang(option)}>
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export default LangSwitch
