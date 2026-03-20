import { describe, expect, it } from 'vitest'
import { getMissionById } from '../content/missions'
import { gradeMission } from './scoring'

describe('gradeMission', () => {
  it('rewards a correct left join submission', () => {
    const mission = getMissionById('ecom-left-join')

    const score = gradeMission({
      mission,
      selectedAnswers: {
        'ecom-left-base': 'customers',
        'ecom-left-join-type': 'left',
      },
      interpretationChoice: 'mc-correct',
      interpretationText:
        'The left join keeps every customer and exposes missing order rows so marketing can find customers without orders.',
      hintsUsed: [],
      attempts: 1,
      runOutput: {
        stdout: '',
        error: null,
        durationMs: 180,
        merged: {
          kind: 'table',
          name: 'merged',
          columns: [
            'order_id',
            'customer_id',
            'product_id',
            'order_date',
            'quantity',
            'sales_amount',
            'customer_name',
            'region',
            'signup_date',
            'segment',
          ],
          rows: [],
          rowCount: 9,
        },
        result: {
          kind: 'table',
          name: 'result',
          columns: ['customer_name', 'region'],
          rows: [
            { customer_name: 'Chloe Kim', region: 'South' },
            { customer_name: 'Farah Ali', region: 'West' },
          ],
          rowCount: 2,
        },
      },
    })

    expect(score.passed).toBe(true)
    expect(score.total).toBeGreaterThanOrEqual(90)
    expect(score.technical).toBe(60)
  })
})
