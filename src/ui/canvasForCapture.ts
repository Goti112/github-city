export type CityPageStatus = 'loading' | 'error' | 'ok'

export const canvasForCapture = (
  status: CityPageStatus,
  canvas: HTMLCanvasElement | null,
): HTMLCanvasElement | null => status === 'ok' ? canvas : null
