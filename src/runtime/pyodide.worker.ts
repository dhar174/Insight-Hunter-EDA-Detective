/// <reference lib="webworker" />

import { loadPyodide, type PyodideInterface, version as pyodideVersion } from 'pyodide'
import type { DataTable, MissionRunOutput } from '../types/game'
import type { WorkerMissionPayload, WorkerRequest, WorkerResponse } from './types'

let pyodide: PyodideInterface | null = null
let activeMission: WorkerMissionPayload | null = null

function toPythonLiteral(value: string) {
  return `r'''${value.replace(/'''/g, "\\'\\'\\'")}'''`
}

function previewTable(table: DataTable) {
  return {
    columns: table.schema.map((column) => column.name),
    rows: table.rows.slice(0, 6),
    rowCount: table.rows.length,
  }
}

function buildMissionSetupCode(mission: WorkerMissionPayload) {
  const setupLines = [
    'import json',
    'import pandas as pd',
    'import sqlite3',
  ]

  for (const table of mission.tables) {
    setupLines.push(
      `${table.name} = pd.DataFrame(json.loads(${toPythonLiteral(
        JSON.stringify(table.rows),
      )}))`,
    )
  }

  if (mission.sqlSeed) {
    setupLines.push('conn = sqlite3.connect(":memory:")')
    setupLines.push(`conn.executescript(${toPythonLiteral(mission.sqlSeed)})`)
  }

  return setupLines.join('\n')
}

function buildRunScript(mission: WorkerMissionPayload, code: string) {
  const setupCode = buildMissionSetupCode(mission)
  const indentedCode = code
    .split('\n')
    .map((line) => `        ${line}`)
    .join('\n')

  return `
import contextlib
import io
import json
import traceback
import pandas as pd

${setupCode}

stdout_buffer = io.StringIO()
error = None

with contextlib.redirect_stdout(stdout_buffer):
    try:
${indentedCode}
    except Exception:
        error = traceback.format_exc()

def serialize_value(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return float(value) if isinstance(value, float) else int(value)
    if value is None:
        return None
    return str(value)

def serialize_object(name):
    if name not in globals():
        return None

    obj = globals()[name]

    if isinstance(obj, pd.Series):
        frame = obj.reset_index()
        value_name = obj.name or "value"
        if frame.columns[-1] != value_name:
            frame = frame.rename(columns={frame.columns[-1]: value_name})
    elif isinstance(obj, pd.DataFrame):
        frame = obj.copy()
        if isinstance(frame.index, pd.MultiIndex) or frame.index.name is not None or any(index_name is not None for index_name in frame.index.names):
            frame = frame.reset_index()
    else:
        return {
            "kind": "value",
            "name": name,
            "value": serialize_value(obj),
        }

    frame = frame.where(pd.notnull(frame), None)
    return {
        "kind": "table",
        "name": name,
        "columns": [str(column) for column in frame.columns],
        "rows": json.loads(frame.to_json(orient="records")),
        "rowCount": int(len(frame)),
    }

json.dumps({
    "stdout": stdout_buffer.getvalue(),
    "error": error,
    "merged": serialize_object("merged"),
    "result": serialize_object("result"),
    "durationMs": 0,
})
`
}

async function ensurePyodide() {
  if (!pyodide) {
    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/',
    })
    await pyodide.loadPackage(['pandas'])
  }

  return pyodide
}

async function handleInit() {
  await ensurePyodide()

  return {
    version: pyodideVersion,
  }
}

async function handleRunCode(code: string) {
  if (!activeMission) {
    throw new Error('No mission is loaded in the worker.')
  }

  const runtime = await ensurePyodide()
  const startedAt = performance.now()
  const script = buildRunScript(activeMission, code)
  const rawResponse = await runtime.runPythonAsync(script)
  const parsed = JSON.parse(String(rawResponse)) as MissionRunOutput

  return {
    ...parsed,
    durationMs: Math.round(performance.now() - startedAt),
  }
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data

  try {
    switch (request.type) {
      case 'init': {
        const payload = await handleInit()
        const response: WorkerResponse = {
          id: request.id,
          type: 'init',
          ok: true,
          payload,
        }
        self.postMessage(response)
        return
      }
      case 'loadMission': {
        activeMission = request.payload
        await ensurePyodide()
        const response: WorkerResponse = {
          id: request.id,
          type: 'loadMission',
          ok: true,
        }
        self.postMessage(response)
        return
      }
      case 'runCode': {
        const payload = await handleRunCode(request.payload.code)
        const response: WorkerResponse = {
          id: request.id,
          type: 'runCode',
          ok: true,
          payload,
        }
        self.postMessage(response)
        return
      }
      case 'resetMission': {
        const response: WorkerResponse = {
          id: request.id,
          type: 'resetMission',
          ok: true,
        }
        self.postMessage(response)
        return
      }
      case 'getTablePreview': {
        const table = activeMission?.tables.find(
          (candidate) => candidate.name === request.payload.tableName,
        )

        if (!table) {
          throw new Error(`Table "${request.payload.tableName}" is not available in this mission.`)
        }

        const response: WorkerResponse = {
          id: request.id,
          type: 'getTablePreview',
          ok: true,
          payload: previewTable(table),
        }
        self.postMessage(response)
        return
      }
      default:
        throw new Error('Unsupported worker message.')
    }
  } catch (error) {
    const response: WorkerResponse = {
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown worker error',
    }
    self.postMessage(response)
  }
}
