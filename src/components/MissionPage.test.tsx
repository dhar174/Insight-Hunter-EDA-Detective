import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { MissionPage } from './MissionPage'
import { ProgressProvider } from '../context/progress'
import { MissionRuntimeProvider } from '../runtime/context'
import type { MissionRuntime } from '../runtime/types'

vi.mock('@uiw/react-codemirror', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea
      aria-label="Code editor"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  ),
}))

const mockRuntime: MissionRuntime = {
  async init() {},
  async loadMission() {},
  async resetMission() {},
  async runCode() {
    return {
      stdout: '',
      error: null,
      merged: null,
      result: null,
      durationMs: 0,
    }
  },
  async getTablePreview(tableName) {
    if (tableName === 'customers') {
      return {
        columns: ['customer_id', 'customer_name', 'region'],
        rows: [{ customer_id: 1, customer_name: 'Ava Stone', region: 'East' }],
        rowCount: 7,
      }
    }

    return {
      columns: ['order_id', 'customer_id', 'sales_amount'],
      rows: [{ order_id: 1001, customer_id: 1, sales_amount: 240 }],
      rowCount: 10,
    }
  },
}

describe('MissionPage', () => {
  it('grades a no-code mission inside the analyst workspace', async () => {
    window.localStorage.setItem(
      'join-quest-progress-v1',
      JSON.stringify({
        version: 1,
        unlockedMissionIds: ['sql-load-warehouse', 'ecom-keys'],
        missionProgress: {},
        lastMissionId: 'ecom-keys',
      }),
    )

    render(
      <MissionRuntimeProvider runtime={mockRuntime}>
        <ProgressProvider>
          <MemoryRouter initialEntries={['/missions/ecom-keys']}>
            <Routes>
              <Route path="/missions/:missionId" element={<MissionPage />} />
            </Routes>
          </MemoryRouter>
        </ProgressProvider>
      </MissionRuntimeProvider>,
    )

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('customer_id'))
    await user.click(screen.getAllByLabelText('customers')[0])
    await user.click(screen.getAllByLabelText('orders')[1])
    await user.click(
      screen.getByLabelText(
        'Because order_id is unique to orders, while customer_id is the shared identifier.',
      ),
    )
    await user.type(
      screen.getAllByRole('textbox')[1],
      'I looked for customer_id because it is the shared key that appears in both tables.',
    )
    await user.click(screen.getByRole('button', { name: 'Grade mission' }))

    expect(await screen.findByText('Total score')).toBeInTheDocument()
    expect(screen.getByText(/Key Pattern Spotted|first win in any multi-table workflow/i)).toBeInTheDocument()
  })
})
