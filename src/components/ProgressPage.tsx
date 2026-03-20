import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { orderedMissions } from '../content/missions'
import { useProgress } from '../context/progress'
import { updateRenderState } from '../lib/renderState'

export function ProgressPage() {
  const { progress, resetProgress } = useProgress()
  const completed = Object.values(progress.missionProgress).filter((mission) => mission.passed)
  const averageScore =
    completed.length === 0
      ? 0
      : Math.round(
          completed.reduce((sum, mission) => sum + mission.bestScore, 0) / completed.length,
        )

  useEffect(() => {
    updateRenderState({
      route: '/progress',
      title: 'Progress summary',
      unlockedMissions: progress.unlockedMissionIds.length,
      totalMissions: orderedMissions.length,
    })
  }, [progress.unlockedMissionIds.length])

  return (
    <div className="page-shell narrow-shell">
      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Progress</span>
            <h1>Mission summary</h1>
          </div>
          <button className="secondary-button" onClick={resetProgress} type="button">
            Reset local progress
          </button>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <span>Completed</span>
            <strong>{completed.length}</strong>
          </div>
          <div className="hero-stat">
            <span>Unlocked</span>
            <strong>{progress.unlockedMissionIds.length}</strong>
          </div>
          <div className="hero-stat">
            <span>Average best score</span>
            <strong>{averageScore}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Mission ledger</span>
            <h2>Every attempt saved locally in this browser</h2>
          </div>
        </div>

        <div className="ledger-list">
          {orderedMissions.map((mission) => {
            const missionProgress = progress.missionProgress[mission.id]

            return (
              <div key={mission.id} className="ledger-row">
                <div>
                  <strong>{mission.title}</strong>
                  <p>{mission.scenario}</p>
                </div>
                <div className="ledger-metrics">
                  <span>{missionProgress?.bestScore ?? 0}</span>
                  <span>{missionProgress?.attempts ?? 0} attempts</span>
                  <Link to={`/missions/${mission.id}`}>Open mission</Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
