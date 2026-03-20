export interface RenderState {
  route: string
  title: string
  missionId?: string
  status?: string
  selectedTable?: string
  unlockedMissions?: number
  totalMissions?: number
}

declare global {
  interface Window {
    __joinQuestRenderState?: RenderState
    render_game_to_text?: () => string
    advanceTime?: (ms: number) => void
  }
}

export function installRenderStateBridge() {
  if (typeof window === 'undefined') {
    return
  }

  window.render_game_to_text = () =>
    JSON.stringify(
      window.__joinQuestRenderState ?? {
        route: 'unknown',
        title: 'Join Quest',
      },
    )

  window.advanceTime = () => {}
}

export function updateRenderState(nextState: RenderState) {
  if (typeof window === 'undefined') {
    return
  }

  window.__joinQuestRenderState = nextState
}
