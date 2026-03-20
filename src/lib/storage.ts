import type { SavedMissionProgress, SavedProgress } from '../types/game'

const STORAGE_KEY = 'join-quest-progress-v1'

export function createEmptyProgress(firstMissionId: string | null): SavedProgress {
  return {
    version: 1,
    unlockedMissionIds: firstMissionId ? [firstMissionId] : [],
    missionProgress: {},
    lastMissionId: firstMissionId,
  }
}

export function loadProgress(firstMissionId: string | null) {
  if (typeof window === 'undefined') {
    return createEmptyProgress(firstMissionId)
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return createEmptyProgress(firstMissionId)
  }

  try {
    const parsed = JSON.parse(raw) as SavedProgress
    return {
      ...createEmptyProgress(firstMissionId),
      ...parsed,
    }
  } catch {
    return createEmptyProgress(firstMissionId)
  }
}

export function saveProgress(progress: SavedProgress) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function mergeMissionProgress(
  existing: SavedMissionProgress | undefined,
  update: SavedMissionProgress,
) {
  if (!existing) {
    return update
  }

  return {
    ...existing,
    ...update,
    bestScore: Math.max(existing.bestScore, update.bestScore),
    hintsUsed: Array.from(new Set([...existing.hintsUsed, ...update.hintsUsed])),
  }
}

export function unlockMission(progress: SavedProgress, missionId: string | null) {
  if (!missionId || progress.unlockedMissionIds.includes(missionId)) {
    return progress
  }

  return {
    ...progress,
    unlockedMissionIds: [...progress.unlockedMissionIds, missionId],
  }
}

export function createMissionProgress(
  missionId: string,
  previous: SavedMissionProgress | undefined,
  payload: Omit<SavedMissionProgress, 'missionId' | 'bestScore' | 'lastVisitedAt'> & {
    score: number
  },
): SavedMissionProgress {
  return {
    missionId,
    attempts: payload.attempts,
    bestScore: Math.max(previous?.bestScore ?? 0, payload.score),
    lastScore: payload.score,
    passed: payload.passed,
    hintsUsed: payload.hintsUsed,
    selectedAnswers: payload.selectedAnswers,
    interpretationChoice: payload.interpretationChoice,
    interpretationText: payload.interpretationText,
    lastVisitedAt: new Date().toISOString(),
  }
}

export function resetStoredProgress(firstMissionId: string | null) {
  const empty = createEmptyProgress(firstMissionId)
  saveProgress(empty)
  return empty
}
