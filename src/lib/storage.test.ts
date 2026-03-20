import { describe, expect, it } from 'vitest'
import { createEmptyProgress, unlockMission } from './storage'

describe('progress storage helpers', () => {
  it('starts with the first mission unlocked and can unlock the next one once', () => {
    const progress = createEmptyProgress('sql-load-warehouse')
    const updated = unlockMission(progress, 'ecom-keys')
    const deduped = unlockMission(updated, 'ecom-keys')

    expect(progress.unlockedMissionIds).toEqual(['sql-load-warehouse'])
    expect(updated.unlockedMissionIds).toEqual(['sql-load-warehouse', 'ecom-keys'])
    expect(deduped.unlockedMissionIds).toEqual(['sql-load-warehouse', 'ecom-keys'])
  })
})
