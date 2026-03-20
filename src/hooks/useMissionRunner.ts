import { useEffect, useState } from 'react'
import { getMissionTables } from '../content/missions'
import { useMissionRuntime } from '../runtime/context'
import type { MissionDefinition, MissionRunOutput, TablePreview } from '../types/game'

export function useMissionRunner(mission: MissionDefinition) {
  const runtime = useMissionRuntime()
  const [runtimeState, setRuntimeState] = useState<
    'idle' | 'loading' | 'ready' | 'running' | 'error'
  >('loading')
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [runOutput, setRunOutput] = useState<MissionRunOutput | null>(null)
  const [tablePreviews, setTablePreviews] = useState<Record<string, TablePreview>>({})

  useEffect(() => {
    let cancelled = false

    async function loadMissionIntoWorker() {
      setRuntimeState('loading')
      setRuntimeError(null)

      try {
        await runtime.loadMission({
          missionId: mission.id,
          tables: getMissionTables(mission),
          sqlSeed: mission.sqlSeed,
        })

        const previews = await Promise.all(
          mission.availableTables.map(async (tableName) => [
            tableName,
            await runtime.getTablePreview(tableName),
          ]),
        )

        if (!cancelled) {
          setTablePreviews(Object.fromEntries(previews))
          setRunOutput(null)
          setRuntimeState('ready')
        }
      } catch (error) {
        if (!cancelled) {
          setRuntimeError(error instanceof Error ? error.message : 'Failed to initialize Python runtime.')
          setRuntimeState('error')
        }
      }
    }

    void loadMissionIntoWorker()

    return () => {
      cancelled = true
    }
  }, [mission, runtime])

  async function runCode(code: string) {
    setRuntimeState('running')
    const output = await runtime.runCode(code)
    setRunOutput(output)
    setRuntimeState(output.error ? 'error' : 'ready')
    setRuntimeError(output.error)
    return output
  }

  async function resetMission() {
    setRuntimeState('loading')
    setRuntimeError(null)
    await runtime.resetMission()
    await runtime.loadMission({
      missionId: mission.id,
      tables: getMissionTables(mission),
      sqlSeed: mission.sqlSeed,
    })

    const previews = await Promise.all(
      mission.availableTables.map(async (tableName) => [
        tableName,
        await runtime.getTablePreview(tableName),
      ]),
    )

    setTablePreviews(Object.fromEntries(previews))
    setRunOutput(null)
    setRuntimeState('ready')
  }

  return {
    runtimeState,
    runtimeError,
    runOutput,
    tablePreviews,
    runCode,
    resetMission,
  }
}
