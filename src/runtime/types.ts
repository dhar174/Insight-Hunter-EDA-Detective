import type { DataTable, MissionRunOutput, TablePreview } from '../types/game'

export interface WorkerMissionPayload {
  missionId: string
  tables: DataTable[]
  sqlSeed?: string
}

export type WorkerRequest =
  | { id: number; type: 'init' }
  | { id: number; type: 'loadMission'; payload: WorkerMissionPayload }
  | { id: number; type: 'runCode'; payload: { code: string } }
  | { id: number; type: 'resetMission' }
  | { id: number; type: 'getTablePreview'; payload: { tableName: string } }

export type WorkerResponse =
  | { id: number; type: 'init'; ok: true; payload: { version: string } }
  | { id: number; type: 'loadMission'; ok: true }
  | { id: number; type: 'runCode'; ok: true; payload: MissionRunOutput }
  | { id: number; type: 'resetMission'; ok: true }
  | { id: number; type: 'getTablePreview'; ok: true; payload: TablePreview }
  | { id: number; ok: false; error: string }

export interface MissionRuntime {
  init: () => Promise<void>
  loadMission: (payload: WorkerMissionPayload) => Promise<void>
  runCode: (code: string) => Promise<MissionRunOutput>
  resetMission: () => Promise<void>
  getTablePreview: (tableName: string) => Promise<TablePreview>
}
