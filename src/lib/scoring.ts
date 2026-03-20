import type {
  ExpectedTable,
  MissionSubmission,
  PythonPreview,
  PythonTablePreview,
  ScoreBreakdown,
  TableRow,
} from '../types/game'

const TECHNICAL_POINTS = {
  precheck: 20,
  code: 40,
}

const ANALYST_POINTS = {
  choice: 15,
  text: 15,
}

const EFFICIENCY_MAX = 10

function isTablePreview(preview: PythonPreview): preview is PythonTablePreview {
  return Boolean(preview) && preview?.kind === 'table'
}

function normalizeRows(rows: TableRow[]) {
  return rows.map((row) => {
    const normalized = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof value === 'number' ? Number(value.toFixed(2)) : value,
      ]),
    )

    return normalized
  })
}

function sortStableRows(rows: TableRow[]) {
  return [...rows].sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right)),
  )
}

function compareExpected(preview: PythonPreview, expected?: ExpectedTable) {
  if (!expected) {
    return { matched: true, feedback: 'No code output check was required for this mission.' }
  }

  if (!isTablePreview(preview)) {
    return {
      matched: false,
      feedback: 'Expected a table-like result, but the required output variable was missing or not a DataFrame/Series.',
    }
  }

  const previewRows = normalizeRows(preview.rows)
  const expectedRows = normalizeRows(expected.rows)
  const sameColumns = expected.columns.every((column) => preview.columns.includes(column))
  const rowsToCompare =
    expected.compareMode === 'unordered' ? sortStableRows(previewRows) : previewRows
  const expectedToCompare =
    expected.compareMode === 'unordered' ? sortStableRows(expectedRows) : expectedRows

  const sameShape =
    sameColumns &&
    rowsToCompare.length === expectedToCompare.length &&
    JSON.stringify(rowsToCompare) === JSON.stringify(expectedToCompare)

  return {
    matched: sameShape,
    feedback: sameShape
      ? 'Output matches the hidden answer key.'
      : 'Your output does not yet match the expected grouped table or row set.',
  }
}

function scorePrechecks(selectedAnswers: Record<string, string>, mission: MissionSubmission['mission']) {
  if (mission.precheckQuestions.length === 0) {
    return { points: TECHNICAL_POINTS.precheck, feedback: 'No pre-check questions on this mission.' }
  }

  const correct = mission.precheckQuestions.filter(
    (question) => selectedAnswers[question.id] === question.correctOptionId,
  ).length
  const points = Math.round((correct / mission.precheckQuestions.length) * TECHNICAL_POINTS.precheck)

  return {
    points,
    feedback: `${correct}/${mission.precheckQuestions.length} planning checks answered correctly.`,
  }
}

function scoreCode(submission: MissionSubmission) {
  if (!submission.mission.codeRequired) {
    return {
      points: TECHNICAL_POINTS.code,
      feedback: 'This mission focused on join planning rather than executable code.',
    }
  }

  if (!submission.runOutput) {
    return {
      points: 0,
      feedback: 'Run the mission code before requesting a grade.',
    }
  }

  if (submission.runOutput.error) {
    return {
      points: 0,
      feedback: 'Fix the Python error before grading the mission.',
    }
  }

  const targetPreview =
    submission.mission.validator.outputVariable === 'merged'
      ? submission.runOutput.merged
      : submission.runOutput.result

  const compared = compareExpected(targetPreview, submission.mission.validator.expectedOutput)
  const previewIsTable = isTablePreview(targetPreview)
  const requiredColumns = submission.mission.validator.requiredColumns ?? []
  const columnsOkay =
    !previewIsTable || requiredColumns.every((column) => targetPreview.columns.includes(column))

  let points = compared.matched ? TECHNICAL_POINTS.code : 0

  if (!compared.matched && previewIsTable && columnsOkay) {
    points = Math.round(TECHNICAL_POINTS.code * 0.4)
  }

  return {
    points,
    feedback: columnsOkay ? compared.feedback : 'Required output columns are missing from your result.',
  }
}

function scoreInterpretation(submission: MissionSubmission) {
  const choiceCorrect =
    submission.interpretationChoice ===
    submission.mission.interpretation.multipleChoice.correctOptionId
  const choicePoints = choiceCorrect ? ANALYST_POINTS.choice : 0
  const text = submission.interpretationText.toLowerCase()
  const keywords = submission.mission.interpretation.shortResponse.requiredKeywords
  const secondary = submission.mission.interpretation.shortResponse.secondaryKeywords ?? []
  const requiredHitCount = keywords.filter((keyword) => text.includes(keyword.toLowerCase())).length
  const secondaryHitCount = secondary.filter((keyword) => text.includes(keyword.toLowerCase())).length
  const textScoreRatio = Math.min(
    1,
    requiredHitCount / Math.max(1, keywords.length) + secondaryHitCount * 0.2,
  )
  const textPoints = Math.round(Math.min(1, textScoreRatio) * ANALYST_POINTS.text)

  return {
    choicePoints,
    textPoints,
    feedback: choiceCorrect
      ? 'Your multiple-choice interpretation is correct.'
      : 'The multiple-choice interpretation still needs adjustment.',
    textFeedback:
      textPoints > 0
        ? 'Your written interpretation includes the key business idea.'
        : 'Add the leading entity plus at least one business implication to strengthen the explanation.',
  }
}

function scoreEfficiency(attempts: number, hintCount: number) {
  const points = Math.max(0, EFFICIENCY_MAX - Math.max(0, attempts - 1) * 2 - hintCount * 2)
  return {
    points,
    feedback: `Efficiency bonus reflects ${attempts} attempt(s) and ${hintCount} hint(s) used.`,
  }
}

export function gradeMission(submission: MissionSubmission): ScoreBreakdown {
  const precheck = scorePrechecks(submission.selectedAnswers, submission.mission)
  const code = scoreCode(submission)
  const interpretation = scoreInterpretation(submission)
  const efficiency = scoreEfficiency(submission.attempts, submission.hintsUsed.length)

  const technical = precheck.points + code.points
  const analyst = interpretation.choicePoints + interpretation.textPoints
  const total = technical + analyst + efficiency.points
  const passed =
    technical >= 36 &&
    analyst >= 15 &&
    (!submission.mission.codeRequired || !submission.runOutput?.error)

  return {
    technical,
    analyst,
    efficiency: efficiency.points,
    total,
    precheck: precheck.points,
    code: code.points,
    interpretationChoice: interpretation.choicePoints,
    interpretationText: interpretation.textPoints,
    feedback: [
      precheck.feedback,
      code.feedback,
      interpretation.feedback,
      interpretation.textFeedback,
      efficiency.feedback,
      passed
        ? submission.mission.validator.successMessage
        : 'Keep iterating. You are close, and the mission will unlock once the key checks pass.',
    ],
    passed,
  }
}
