// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setLang } from '../i18n/useLang'
import Home from '../pages/Home'

vi.mock('../scene/LazyCityScene', () => ({ default: () => null }))

afterEach(() => {
  cleanup()
  setLang('es')
})

describe('language switch', () => {
  it('is Spanish by default and switches the page to English', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Un perfil. Una ciudad.' })).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'EN' }))

    expect(screen.getByRole('heading', { name: 'One profile. One city.' })).toBeTruthy()
    expect(screen.getByPlaceholderText('Type a GitHub username')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'EN' }).getAttribute('aria-pressed')).toBe('true')
    expect(document.documentElement.lang).toBe('en')
  })
})
