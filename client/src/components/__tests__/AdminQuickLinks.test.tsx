// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AdminQuickLinks } from '../AdminQuickLinks'

let mockUser: any = null
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }))

afterEach(() => {
  cleanup()
  mockUser = null
})

it('renders nothing for unauthenticated users', () => {
  mockUser = null

  const { container } = render(
    <MemoryRouter>
      <AdminQuickLinks />
    </MemoryRouter>
  )

  expect(container.innerHTML).toBe('')
})

it('renders nothing for ineligible roles', () => {
  mockUser = { id: '1', email: 'a', name: 'A', role: 'member' }

  render(
    <MemoryRouter>
      <AdminQuickLinks />
    </MemoryRouter>
  )

  expect(screen.queryByText('New HTML/MJML')).toBeNull()
})

it.each([
  'system_admin',
  'admin',
  'verified_publisher',
  'verified_influencer',
  'advertiser',
])('shows link for %s role', role => {
  mockUser = { id: '1', email: 'a', name: 'A', role }

  render(
    <MemoryRouter>
      <AdminQuickLinks />
    </MemoryRouter>
  )

  const link = screen.getByText('New HTML/MJML') as HTMLAnchorElement
  expect(link).toBeTruthy()
  expect(link.getAttribute('href')).toBe('/admin/new-html')
})
