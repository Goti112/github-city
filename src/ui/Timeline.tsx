import { useEffect, useState, type ReactElement } from 'react'
import { useStrings } from '../i18n/useLang'
import type { TimelineRange } from '../lib/timeline'

type TimelineProps = {
  range: TimelineRange
  year: number | null // null = today, the full city
  builtCount: number
  total: number
  onChange: (year: number | null) => void
}

const stepMs = 900

// History slider: replay how the city was built, one year at a time.
const Timeline = ({ range, year, builtCount, total, onChange }: TimelineProps): ReactElement => {
  const [playing, setPlaying] = useState(false)
  const t = useStrings()
  const current = year ?? range.last

  // One tick per year while playing; each new year schedules the next.
  useEffect(() => {
    if (!playing) {
      return
    }
    const timeout = window.setTimeout(() => {
      const next = current + 1
      if (next >= range.last) {
        onChange(null)
        setPlaying(false)
      } else {
        onChange(next)
      }
    }, stepMs)
    return () => window.clearTimeout(timeout)
  }, [current, onChange, playing, range.last])

  const handlePlay = (): void => {
    if (playing) {
      setPlaying(false)
      return
    }
    // Start from the very beginning: an empty plot before the first repository.
    onChange(range.first - 1)
    setPlaying(true)
  }

  return (
    <div className="timeline" role="group" aria-label="Historia de la ciudad">
      <button type="button" className="timeline__play" onClick={handlePlay} aria-label={playing ? t.pauseHistory : t.playHistory}>
        {playing ? '❚❚' : '▶'}
      </button>
      <input
        type="range"
        min={range.first - 1}
        max={range.last}
        step={1}
        value={current}
        aria-label={t.year}
        aria-valuetext={`${current}: ${t.builtOf(builtCount, total)}`}
        onChange={(event) => {
          setPlaying(false)
          const value = Number(event.currentTarget.value)
          onChange(value >= range.last ? null : value)
        }}
      />
      <p className="timeline__label" aria-live="polite">
        <strong>{current}</strong> · {t.builtOf(builtCount, total)}
      </p>
    </div>
  )
}

export default Timeline
