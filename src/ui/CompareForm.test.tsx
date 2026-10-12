// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import CompareForm from './CompareForm'

const DuelProbe = (): string => {
  const { left, right } = useParams()
  return `duelo ${left} contra ${right}`
}

const renderForm = (left?: string): void => {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<CompareForm left={left} />} />
        <Route path="/vs/:left/:right" element={<DuelProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(cleanup)

describe('CompareForm', () => {
  it('opens the duel page with both trimmed usernames', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Primer usuario'), ' gaearon ')
    await userEvent.type(screen.getByLabelText('Usuario rival'), 'Goti112')
    await userEvent.click(screen.getByRole('button', { name: /duelo/i }))

    expect(screen.getByText('duelo gaearon contra Goti112')).toBeTruthy()
  })

  it('rejects invalid usernames', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Primer usuario'), 'a b')
    await userEvent.type(screen.getByLabelText('Usuario rival'), 'Goti112')
    await userEvent.click(screen.getByRole('button', { name: /duelo/i }))

    expect(screen.getByRole('alert').textContent).toBe('Escribe dos usuarios de GitHub válidos')
  })

  it('does not let someone duel themselves, whatever the casing', async () => {
    renderForm('Goti112')
    await userEvent.type(screen.getByLabelText('Usuario rival'), 'goti112')
    await userEvent.click(screen.getByRole('button', { name: /duelo/i }))

    expect(screen.getByRole('alert').textContent).toBe('Elige a alguien distinto para el duelo')
  })
})
