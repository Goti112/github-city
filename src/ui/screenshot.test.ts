import { describe, expect, it, vi } from 'vitest'

describe('captureCity', () => {
  it('copies the WebGL canvas and adds the project watermark', async () => {
    const source = { width: 1200, height: 630 } as HTMLCanvasElement
    const blob = new Blob(['png'], { type: 'image/png' })
    const fillStyles: string[] = []
    const context = {
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      set fillStyle(value: string) {
        fillStyles.push(value)
      },
    } as unknown as CanvasRenderingContext2D
    const output = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      toBlob: vi.fn((callback: BlobCallback) => callback(blob)),
    } as unknown as HTMLCanvasElement
    vi.stubGlobal('document', { createElement: vi.fn(() => output) })

    const { captureCity } = await import('./screenshot')
    const result = await captureCity(source, 'torvalds')

    expect(output.width).toBe(source.width)
    expect(output.height).toBe(source.height)
    expect(context.drawImage).toHaveBeenCalledWith(source, 0, 0, source.width, source.height)
    expect(context.fillText).toHaveBeenCalledWith(
      'github-city · miquelmanzano.com',
      expect.any(Number),
      expect.any(Number),
    )
    expect(fillStyles).toEqual(['rgba(9, 16, 23, 0.82)', '#eff5f7'])
    expect(context.textAlign).toBe('right')
    expect(result).toBe(blob)
  })
})
