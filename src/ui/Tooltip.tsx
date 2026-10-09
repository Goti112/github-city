import type { ReactElement } from 'react'
import { tooltipTransform } from './tooltipTransform'

export type PointerPosition = {
  x: number
  y: number
}

type TooltipProps = {
  label: string
  position: PointerPosition
}

const Tooltip = ({ label, position }: TooltipProps): ReactElement => (
  <div
    className="city-tooltip"
    role="tooltip"
    style={{
      left: position.x,
      top: position.y,
      transform: tooltipTransform(position, { width: window.innerWidth, height: window.innerHeight }),
    }}
  >
    {label}
  </div>
)

export default Tooltip
