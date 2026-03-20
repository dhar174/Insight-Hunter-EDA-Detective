import { python } from '@codemirror/lang-python'
import CodeMirror from '@uiw/react-codemirror'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getMissionById, getMissionTables, getNextMissionId } from '../content/missions'
import { useProgress } from '../context/progress'
import { useMissionRunner } from '../hooks/useMissionRunner'
import { updateRenderState } from '../lib/renderState'
import { gradeMission } from '../lib/scoring'
import type { MissionDefinition } from '../types/game'
import { OutputPanel } from './mission/OutputPanel'
import { RelationshipMap } from './mission/RelationshipMap'
import { TableExplorer } from './mission/TableExplorer'

export function MissionPage() {
  const { missionId } = useParams()
  const { isUnlocked } = useProgress()
  const mission = missionId ? getMissionById(missionId) : undefined

  if (!mission || !isUnlocked(mission.id)) {
    return <Navigate to="/" replace />
  }

  return <MissionWorkspace key={mission.id} mission={mission} />
}

function MissionWorkspace({ mission }: { mission: MissionDefinition }) {
  const { progress, saveMissionResult } = useProgress()
  const savedProgress = progress.missionProgress[mission.id]
  const missionTables = getMissionTables(mission)
  const [selectedTable, setSelectedTable] = useState(mission.availableTables[0] ?? '')
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(
    savedProgress?.selectedAnswers ?? {},
  )
  const [selectedEdges, setSelectedEdges] = useState<string[]>([])
  const [code, setCode] = useState(mission.starterCode)
  const [attempts, setAttempts] = useState(savedProgress?.attempts ?? 0)
  const [hintIds, setHintIds] = useState<string[]>(savedProgress?.hintsUsed ?? [])
  const [interpretationChoice, setInterpretationChoice] = useState(
    savedProgress?.interpretationChoice ?? '',
  )
  const [interpretationText, setInterpretationText] = useState(
    savedProgress?.interpretationText ?? '',
  )
  const [score, setScore] = useState<ReturnType<typeof gradeMission> | null>(null)
  const { runtimeState, runtimeError, runOutput, tablePreviews, runCode, resetMission } =
    useMissionRunner(mission)

  useEffect(() => {
    updateRenderState({
      route: `/missions/${mission.id}`,
      title: mission.title,
      missionId: mission.id,
      status: runtimeState,
      selectedTable,
      unlockedMissions: progress.unlockedMissionIds.length,
    })
  }, [mission.id, mission.title, progress.unlockedMissionIds.length, runtimeState, selectedTable])

  async function handleRunCode() {
    setAttempts((current) => current + 1)
    await runCode(code)
  }

  function revealHint(hintId: string) {
    setHintIds((current) => (current.includes(hintId) ? current : [...current, hintId]))
  }

  function handleEvaluate() {
    const nextScore = gradeMission({
      mission,
      selectedAnswers,
      interpretationChoice,
      interpretationText,
      hintsUsed: hintIds,
      attempts: Math.max(1, attempts),
      runOutput,
    })

    setScore(nextScore)
    saveMissionResult({
      missionId: mission.id,
      score: nextScore,
      attempts: Math.max(1, attempts),
      hintsUsed: hintIds,
      selectedAnswers,
      interpretationChoice,
      interpretationText,
    })
  }

  const nextMissionId = score?.passed ? getNextMissionId(mission.id) : null

  return (
    <div className="page-shell mission-shell">
      <section className="mission-hero">
        <div>
          <Link className="back-link" to="/">
            Back to campaign
          </Link>
          <span className="eyebrow">{mission.scenario}</span>
          <h1>{mission.title}</h1>
          <p>{mission.subtitle}</p>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <span>Difficulty</span>
            <strong>{mission.difficulty}</strong>
          </div>
          <div className="hero-stat">
            <span>Attempts</span>
            <strong>{attempts}</strong>
          </div>
          <div className="hero-stat">
            <span>Hints used</span>
            <strong>{hintIds.length}</strong>
          </div>
        </div>
      </section>

      <div className="mission-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">1. Business Request</span>
              <h2>{mission.stakeholder}</h2>
            </div>
          </div>
          <p className="request-brief">{mission.brief}</p>
          <p className="subtle-copy">{mission.whyItMatters}</p>
          <div className="request-callout">
            <strong>Required output</strong>
            <p>{mission.requiredOutput}</p>
          </div>

          <div className="question-stack">
            {mission.precheckQuestions.map((question) => (
              <fieldset key={question.id} className="question-card">
                <legend>{question.prompt}</legend>
                {question.options.map((option) => (
                  <label key={option.id} className="radio-row">
                    <input
                      checked={selectedAnswers[question.id] === option.id}
                      name={question.id}
                      onChange={() =>
                        setSelectedAnswers((current) => ({
                          ...current,
                          [question.id]: option.id,
                        }))
                      }
                      type="radio"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>

          <div className="hint-section">
            <h3>Hint system</h3>
            <div className="hint-list">
              {mission.hints.map((hint) => {
                const revealed = hintIds.includes(hint.id)

                return (
                  <div key={hint.id} className="hint-card">
                    <div className="hint-header">
                      <strong>{hint.title}</strong>
                      <span>-{hint.cost} efficiency</span>
                    </div>
                    {revealed ? (
                      <p>{hint.body}</p>
                    ) : (
                      <button
                        className="secondary-button"
                        onClick={() => revealHint(hint.id)}
                        type="button"
                      >
                        Reveal hint
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <TableExplorer
          tables={missionTables}
          previews={tablePreviews}
          selectedTable={selectedTable}
          onSelectTable={setSelectedTable}
        />

        <RelationshipMap
          tables={mission.requiredTables}
          edges={mission.relationshipEdges}
          selectedEdges={selectedEdges}
          onToggleEdge={(edgeId) =>
            setSelectedEdges((current) =>
              current.includes(edgeId)
                ? current.filter((candidate) => candidate !== edgeId)
                : [...current, edgeId],
            )
          }
        />

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">4. Code Editor</span>
              <h2>Python workspace</h2>
            </div>
            <div className="runtime-badge">{runtimeState}</div>
          </div>
          <p className="subtle-copy">
            Available DataFrames: {mission.availableTables.join(', ')}
            {mission.sqlSeed ? ', conn' : ''}
          </p>
          <CodeMirror
            className="code-editor"
            extensions={[python()]}
            height="320px"
            value={code}
            onChange={setCode}
          />
          {runtimeError ? <p className="error-inline">{runtimeError}</p> : null}
          <div className="button-row">
            <button
              className="primary-button"
              disabled={runtimeState === 'loading' || runtimeState === 'running'}
              onClick={() => void handleRunCode()}
              type="button"
            >
              Run Python
            </button>
            <button
              className="secondary-button"
              onClick={() => void resetMission()}
              type="button"
            >
              Reset runtime
            </button>
          </div>
        </section>

        <OutputPanel mission={mission} runOutput={runOutput} score={score} />

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">6. Interpretation</span>
              <h2>Tell leadership what the result means</h2>
            </div>
          </div>

          <fieldset className="question-card">
            <legend>{mission.interpretation.multipleChoice.prompt}</legend>
            {mission.interpretation.multipleChoice.options.map((option) => (
              <label key={option.id} className="radio-row">
                <input
                  checked={interpretationChoice === option.id}
                  name={`${mission.id}-interpretation`}
                  onChange={() => setInterpretationChoice(option.id)}
                  type="radio"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>

          <label className="text-area-label">
            <span>{mission.interpretation.shortResponse.prompt}</span>
            <textarea
              placeholder={mission.interpretation.shortResponse.placeholder}
              rows={5}
              value={interpretationText}
              onChange={(event) => setInterpretationText(event.target.value)}
            />
          </label>

          <div className="button-row">
            <button className="primary-button" onClick={handleEvaluate} type="button">
              Grade mission
            </button>
            {nextMissionId ? (
              <Link className="secondary-button link-button" to={`/missions/${nextMissionId}`}>
                Open next mission
              </Link>
            ) : null}
          </div>

          <div className="request-callout soft-callout">
            <strong>Model answer</strong>
            <p>{mission.interpretation.modelAnswer}</p>
          </div>
        </section>
      </div>
    </div>
  )
}
