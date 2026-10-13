// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import axe from 'axe-core'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Repo } from '../lib/types'
import Home from '../pages/Home'
import NotFound, { UserNotFound } from '../pages/NotFound'
import BadgePopover from './BadgePopover'
import RepoFinder from './RepoFinder'
import RepoPanel from './RepoPanel'
import ShortcutsHelp from './ShortcutsHelp'
import Timeline from './Timeline'
import Toolbar from './Toolbar'

// WebGL is not available in jsdom; the 3D scene is not what these tests audit.
vi.mock('../scene/LazyCityScene', () => ({ default: () => null }))

const repo: Repo = {
  name: 'portfolio',
  description: 'Mi portfolio',
  url: 'https://github.com/Goti112/portfolio',
  stars: 3,
  language: 'TypeScript',
  languageColor: '#3178c6',
  commits: 69,
  lastPush: '2026-10-06T00:00:00.000Z',
  createdAt: '2025-02-01T00:00:00.000Z',
}

// Accessibility audit of the rendered DOM. Colour contrast needs real layout, so it is checked by eye.
const violations = async (ui: ReactElement): Promise<string[]> => {
  const { container } = render(<MemoryRouter>{ui}</MemoryRouter>)
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
  return results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

afterEach(cleanup)

describe('accessibility (axe)', () => {
  const cases: Array<[string, ReactElement]> = [
    ['Home', <Home />],
    ['NotFound', <NotFound />],
    ['UserNotFound', <UserNotFound />],
    ['RepoPanel', <RepoPanel repo={repo} onClose={() => undefined} />],
    ['RepoFinder', <RepoFinder repos={[repo]} onSelect={() => undefined} onClose={() => undefined} />],
    ['Timeline', <Timeline range={{ first: 2024, last: 2026 }} year={null} builtCount={1} total={1} onChange={() => undefined} />],
    ['ShortcutsHelp', <ShortcutsHelp onClose={() => undefined} />],
    ['BadgePopover', <BadgePopover login="Goti112" />],
    [
      'Toolbar',
      <Toolbar
        canvas={null}
        login="Goti112"
        timeOfDay={1}
        onToggleTime={() => undefined}
        onOpenFinder={() => undefined}
        onOpenDuel={() => undefined}
        onOpenBadge={() => undefined}
      />,
    ],
  ]

  it.each(cases)('%s has no detectable violations', async (_name, ui) => {
    expect(await violations(ui)).toEqual([])
  })

  it('actually catches problems (control case)', async () => {
    const found = await violations(<div><img src="/x.png" /><button type="button" /></div>)
    expect(found.some((violation) => violation.startsWith('image-alt'))).toBe(true)
    expect(found.some((violation) => violation.startsWith('button-name'))).toBe(true)
  })
})
