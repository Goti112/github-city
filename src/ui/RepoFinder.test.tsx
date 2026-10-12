// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Repo } from '../lib/types'
import RepoFinder from './RepoFinder'

const makeRepo = (name: string, commits: number, language: string | null = 'TypeScript'): Repo => ({
  name,
  description: null,
  url: `https://github.com/example/${name}`,
  stars: 0,
  language,
  languageColor: '#3178c6',
  commits,
  lastPush: '2026-10-01T00:00:00.000Z',
  createdAt: '2020-01-01T00:00:00.000Z',
})

const repos = [makeRepo('react-hot-loader', 1890), makeRepo('react-proxy', 211), makeRepo('spotybits', 17, 'PHP')]

afterEach(cleanup)

describe('RepoFinder', () => {
  it('focuses the search box and lists the biggest buildings first', () => {
    render(<RepoFinder repos={repos} onSelect={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('combobox')).toHaveProperty('ownerDocument.activeElement', screen.getByRole('combobox'))
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      expect.stringContaining('react-hot-loader'),
      expect.stringContaining('react-proxy'),
      expect.stringContaining('spotybits'),
    ])
  })

  it('filters as you type and picks the highlighted result with the keyboard', async () => {
    const onSelect = vi.fn()
    render(<RepoFinder repos={repos} onSelect={onSelect} onClose={vi.fn()} />)

    await userEvent.type(screen.getByRole('combobox'), 'react')
    expect(screen.getAllByRole('option')).toHaveLength(2)

    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledWith(repos[1])
  })

  it('says so when nothing matches', async () => {
    render(<RepoFinder repos={repos} onSelect={vi.fn()} onClose={vi.fn()} />)
    await userEvent.type(screen.getByRole('combobox'), 'zzz')
    expect(screen.getByText('Ningún edificio coincide')).toBeTruthy()
  })

  it('closes with Escape', async () => {
    const onClose = vi.fn()
    render(<RepoFinder repos={repos} onSelect={vi.fn()} onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
