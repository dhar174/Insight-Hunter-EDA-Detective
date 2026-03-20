import type {
  MissionDefinition,
  MissionRunOutput,
  PythonTablePreview,
  ScoreBreakdown,
} from '../../types/game'

function findNumericColumn(rows: PythonTablePreview['rows'], columns: string[]) {
  return columns.find((column) => typeof rows[0]?.[column] === 'number')
}

function MiniBarChart({ preview }: { preview: PythonTablePreview }) {
  const numericColumn = findNumericColumn(preview.rows, preview.columns.filter((column) => column !== preview.columns[0]))

  if (!numericColumn) {
    return null
  }

  const maxValue = Math.max(...preview.rows.map((row) => Number(row[numericColumn] ?? 0)), 1)

  return (
    <div className="bar-chart">
      {preview.rows.slice(0, 6).map((row, index) => (
        <div key={`${preview.name}-${index}`} className="bar-row">
          <span>{String(row[preview.columns[0]])}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${(Number(row[numericColumn] ?? 0) / maxValue) * 100}%`,
              }}
            />
          </div>
          <strong>{String(row[numericColumn])}</strong>
        </div>
      ))}
    </div>
  )
}

function OutputTable({ preview }: { preview: PythonTablePreview }) {
  return (
    <table className="data-table compact-table">
      <thead>
        <tr>
          {preview.columns.map((column) => (
            <th key={column}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {preview.rows.slice(0, 8).map((row, rowIndex) => (
          <tr key={`${preview.name}-${rowIndex}`}>
            {preview.columns.map((column) => (
              <td key={column}>{String(row[column] ?? 'null')}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function OutputPanel({
  mission,
  runOutput,
  score,
}: {
  mission: MissionDefinition
  runOutput: MissionRunOutput | null
  score: ScoreBreakdown | null
}) {
  const targetPreview =
    mission.outputVariable === 'merged' ? runOutput?.merged : runOutput?.result ?? runOutput?.merged
  const tablePreview: PythonTablePreview | null =
    targetPreview && targetPreview.kind === 'table' ? targetPreview : null

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">5. Output Area</span>
          <h2>Results and Feedback</h2>
        </div>
      </div>

      {!runOutput ? (
        <p className="subtle-copy">
          Run your code to preview the joined table, grouped summary, or error feedback.
        </p>
      ) : (
        <>
          {runOutput.stdout ? (
            <div className="stdout-box">
              <strong>stdout</strong>
              <pre>{runOutput.stdout}</pre>
            </div>
          ) : null}

          {runOutput.error ? (
            <div className="error-box">
              <strong>Python error</strong>
              <pre>{runOutput.error}</pre>
            </div>
          ) : null}

          {tablePreview ? (
            <>
              <div className="result-meta">
                <span>{tablePreview.rowCount} row(s) in the captured output</span>
                <span>Runtime: {runOutput.durationMs} ms</span>
              </div>
              <OutputTable preview={tablePreview} />
              <MiniBarChart preview={tablePreview} />
            </>
          ) : null}
        </>
      )}

      {score ? (
        <div className={`score-card ${score.passed ? 'score-card-pass' : 'score-card-retry'}`}>
          <div className="score-total">
            <span>Total score</span>
            <strong>{score.total}</strong>
          </div>
          <div className="score-breakdown">
            <span>Technical {score.technical}/60</span>
            <span>Analyst {score.analyst}/30</span>
            <span>Efficiency {score.efficiency}/10</span>
          </div>
          <ul className="plain-list">
            {score.feedback.map((feedback) => (
              <li key={feedback}>{feedback}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
