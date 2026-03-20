/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'
import { getRuntimeSingleton } from './client'
import type { MissionRuntime } from './types'

const MissionRuntimeContext = createContext<MissionRuntime | null>(null)

export function MissionRuntimeProvider({
  runtime,
  children,
}: {
  runtime?: MissionRuntime
  children: ReactNode
}) {
  return (
    <MissionRuntimeContext.Provider value={runtime ?? getRuntimeSingleton()}>
      {children}
    </MissionRuntimeContext.Provider>
  )
}

export function useMissionRuntime() {
  return useContext(MissionRuntimeContext) ?? getRuntimeSingleton()
}
