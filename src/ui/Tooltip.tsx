import type { ReactElement } from 'react'

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
    style={{ left: position.x, top: position.y }}
  >
    {label}
  </div>
)

export default Tooltip
