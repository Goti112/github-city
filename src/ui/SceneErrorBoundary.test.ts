import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

describe('SceneErrorBoundary', () => {
  it('shows a recoverable fallback after a scene error', async () => {
    const { SceneErrorBoundary } = await import('./SceneErrorBoundary')
    const fallback = createElement('p', { role: 'alert' }, 'La escena no está disponible')
    const boundary = new SceneErrorBoundary({
      children: createElement('canvas'),
      fallback,
    })
    const errorState = SceneErrorBoundary.getDerivedStateFromError(new Error('WebGL failed'))
    Object.assign(boundary, { state: errorState })

    expect(boundary.render()).toBe(fallback)
  })
})