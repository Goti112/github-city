import type { PointerPosition } from './Tooltip'

// Room the tooltip needs to the right of / below the pointer before it flips to the other side.
const flipMarginX = 280
const flipMarginY = 60

export const tooltipTransform = (position: PointerPosition, viewport: { width: number; height: number }): string => {
  const x = position.x > viewport.width - flipMarginX ? 'calc(-100% - 14px)' : '14px'
  const y = position.y > viewport.height - flipMarginY ? 'calc(-100% - 14px)' : '14px'
  return `translate(${x}, ${y})`
}
