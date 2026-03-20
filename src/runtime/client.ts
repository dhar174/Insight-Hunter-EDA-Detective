import type { MissionRunOutput } from '../types/game'
import type { MissionRuntime, WorkerMissionPayload, WorkerRequest, WorkerResponse } from './types'

const RUN_TIMEOUT_MS = 7000

type WorkerSuccessResponse = Extract<WorkerResponse, { ok: true }>

function createWorker() {
  return new Worker(new URL('./pyodide.worker.ts', import.meta.url), {
    type: 'module',
  })
}

export class PyodideMissionRuntime implements MissionRuntime {
  private worker = createWorker()

  private requestId = 0

  private initialized = false

  private currentMission: WorkerMissionPayload | null = null

  private pending = new Map<
    number,
    {
      resolve: (value: WorkerSuccessResponse) => void
      reject: (reason?: unknown) => void
    }
  >()

  constructor() {
    this.attachWorker()
  }

  private attachWorker() {
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data
      const pendingRequest = this.pending.get(response.id)

      if (!pendingRequest) {
        return
      }

      this.pending.delete(response.id)

      if (!response.ok) {
        pendingRequest.reject(new Error(response.error))
        return
      }

      pendingRequest.resolve(response)
    }
  }

  private async request(request: { type: WorkerRequest['type']; payload?: unknown }) {
    const id = ++this.requestId
    const message = { ...request, id } as WorkerRequest

    return new Promise<WorkerSuccessResponse>((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.worker.postMessage(message)
    })
  }

  async init() {
    if (this.initialized) {
      return
    }

    await this.request({ type: 'init' })
    this.initialized = true
  }

  async loadMission(payload: WorkerMissionPayload) {
    await this.init()
    this.currentMission = payload
    await this.request({ type: 'loadMission', payload })
  }

  private async recycleWorker() {
    this.worker.terminate()
    this.worker = createWorker()
    this.pending.clear()
    this.initialized = false
    this.attachWorker()
    await this.init()

    if (this.currentMission) {
      await this.request({ type: 'loadMission', payload: this.currentMission })
    }
  }

  async runCode(code: string): Promise<MissionRunOutput> {
    await this.init()

    try {
      const response = await Promise.race([
        this.request({ type: 'runCode', payload: { code } }),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => {
            reject(new Error('Python execution timed out. The worker was reset.'))
          }, RUN_TIMEOUT_MS),
        ),
      ])

      if (response.type !== 'runCode') {
        throw new Error('Unexpected worker response.')
      }

      return response.payload
    } catch (error) {
      await this.recycleWorker()

      return {
        stdout: '',
        error: error instanceof Error ? error.message : 'Execution failed.',
        merged: null,
        result: null,
        durationMs: RUN_TIMEOUT_MS,
      }
    }
  }

  async resetMission() {
    if (!this.currentMission) {
      return
    }

    await this.recycleWorker()
  }

  async getTablePreview(tableName: string) {
    await this.init()
    const response = await this.request({
      type: 'getTablePreview',
      payload: { tableName },
    })

    if (response.type !== 'getTablePreview') {
      throw new Error('Unexpected worker response while fetching table preview.')
    }

    return response.payload
  }
}

let runtimeSingleton: PyodideMissionRuntime | null = null

export function getRuntimeSingleton() {
  runtimeSingleton ??= new PyodideMissionRuntime()
  return runtimeSingleton
}
