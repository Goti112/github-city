import { describe, expect, it } from 'vitest'

describe('canvasForCapture', () => {
  it('does not expose a canvas until the city is ready', async () => {
    const { canvasForCapture } = await import('./canvasForCapture')
    const canvas = {} as HTMLCanvasElement

    expect(canvasForCapture('loading', canvas)).toBeNull()
    expect(canvasForCapture('error', canvas)).toBeNull()
  })

  it('exposes the final city canvas after loading succeeds', async () => {
    const { canvasForCapture } = await import('./canvasForCapture')
    const canvas = {} as HTMLCanvasElement

    expect(canvasForCapture('ok', canvas)).toBe(canvas)
  })
})
