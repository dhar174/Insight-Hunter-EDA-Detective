import { Link } from 'react-router-dom'
import { orderedMissions, scenarioPacks } from '../content/missions'
import { useProgress } from '../context/progress'
import { updateRenderState } from '../lib/renderState'
import { useEffect } from 'react'

export function CampaignPage() {
  const { progress, isUnlocked } = useProgress()
  const completed = Object.values(progress.missionProgress).filter((mission) => mission.passed).length

  useEffect(() => {
    updateRenderState({
      route: '/',
      title: 'Campaign map',
      unlockedMissions: progress.unlockedMissionIds.length,
      totalMissions: orderedMissions.length,
    })
  }, [progress.unlockedMissionIds.length])

  return (
    <div className="page-shell">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Join Quest</span>
          <h1>Learn SQL-style thinking in pandas, one analyst request at a time.</h1>
          <p>
            Step into a business analyst simulation where no single table has the whole truth. Load
            SQL data, identify keys, choose join types, and explain what leadership should do next.
          </p>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <span>Missions complete</span>
            <strong>{completed}</strong>
          </div>
          <div className="hero-stat">
            <span>Unlocked</span>
            <strong>{progress.unlockedMissionIds.length}</strong>
          </div>
          <div className="hero-stat">
            <span>Current focus</span>
            <strong>{progress.lastMissionId ?? 'Start onboarding'}</strong>
          </div>
        </div>
      </section>

      <section className="packs-grid">
        {scenarioPacks.map((pack) => (
          <article key={pack.id} className="pack-card" style={{ ['--pack-accent' as string]: pack.accent }}>
            <div className="pack-header">
              <div>
                <span className="eyebrow">{pack.title}</span>
                <h2>{pack.summary}</h2>
              </div>
            </div>

            <div className="mission-list">
              {pack.missions.map((mission) => {
                const missionProgress = progress.missionProgress[mission.id]
                const unlocked = isUnlocked(mission.id)

                return (
                  <Link
                    key={mission.id}
                    className={`mission-card-link ${unlocked ? '' : 'mission-card-link-locked'}`}
                    to={unlocked ? `/missions/${mission.id}` : '#'}
                    onClick={(event) => {
                      if (!unlocked) {
                        event.preventDefault()
                      }
                    }}
                  >
                    <div className="mission-card-topline">
                      <span>{mission.sequence}</span>
                      <span>{mission.difficulty}</span>
                    </div>
                    <strong>{mission.title}</strong>
                    <p>{mission.subtitle}</p>
                    <div className="mission-card-meta">
                      <span>{unlocked ? 'Unlocked' : 'Locked'}</span>
                      <span>{missionProgress?.bestScore ? `Best ${missionProgress.bestScore}` : 'New'}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
