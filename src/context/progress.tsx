/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react'
import { firstMissionId, getNextMissionId } from '../content/missions'
import { createMissionProgress, loadProgress, mergeMissionProgress, resetStoredProgress, saveProgress, unlockMission } from '../lib/storage'
import type { SavedProgress, ScoreBreakdown } from '../types/game'

interface ProgressContextValue {
  progress: SavedProgress
  saveMissionResult: (payload: {
    missionId: string
    score: ScoreBreakdown
    attempts: number
    hintsUsed: string[]
    selectedAnswers: Record<string, string>
    interpretationChoice: string
    interpretationText: string
  }) => void
  resetProgress: () => void
  isUnlocked: (missionId: string) => boolean
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(() => loadProgress(firstMissionId))

  function saveMissionResult(payload: {
    missionId: string
    score: ScoreBreakdown
    attempts: number
    hintsUsed: string[]
    selectedAnswers: Record<string, string>
    interpretationChoice: string
    interpretationText: string
  }) {
    setProgress((current) => {
      const existing = current.missionProgress[payload.missionId]
      const missionProgress = createMissionProgress(
        payload.missionId,
        existing,
        {
          score: payload.score.total,
          attempts: payload.attempts,
          passed: payload.score.passed,
          hintsUsed: payload.hintsUsed,
          selectedAnswers: payload.selectedAnswers,
          interpretationChoice: payload.interpretationChoice,
          interpretationText: payload.interpretationText,
          lastScore: payload.score.total,
        },
      )

      let nextState: SavedProgress = {
        ...current,
        missionProgress: {
          ...current.missionProgress,
          [payload.missionId]: mergeMissionProgress(existing, missionProgress),
        },
        lastMissionId: payload.missionId,
      }

      if (payload.score.passed) {
        nextState = unlockMission(nextState, getNextMissionId(payload.missionId))
      }

      saveProgress(nextState)
      return nextState
    })
  }

  function resetProgress() {
    const reset = resetStoredProgress(firstMissionId)
    setProgress(reset)
  }

  function isUnlocked(missionId: string) {
    return progress.unlockedMissionIds.includes(missionId)
  }

  return (
    <ProgressContext.Provider
      value={{
        progress,
        saveMissionResult,
        resetProgress,
        isUnlocked,
      }}
    >
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const value = useContext(ProgressContext)

  if (!value) {
    throw new Error('useProgress must be used inside ProgressProvider.')
  }

  return value
}
