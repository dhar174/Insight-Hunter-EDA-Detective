export type Primitive = string | number | boolean | null

export type TableRow = Record<string, Primitive>

export interface TableColumn {
  name: string
  type: string
  role?: 'primary' | 'foreign' | 'dimension' | 'metric'
  references?: {
    table: string
    column: string
  }
}

export interface DataTable {
  name: string
  label: string
  description: string
  schema: TableColumn[]
  rows: TableRow[]
  keyHints: string[]
}

export interface RelationshipEdge {
  id: string
  from: string
  to: string
  key: string
  label: string
}

export interface HintStep {
  id: string
  title: string
  body: string
  cost: number
}

export interface QuestionOption {
  id: string
  label: string
}

export interface PrecheckQuestion {
  id: string
  prompt: string
  options: QuestionOption[]
  correctOptionId: string
  concept: 'key' | 'join' | 'base' | 'table'
}

export interface InterpretationPrompt {
  multipleChoice: {
    prompt: string
    options: QuestionOption[]
    correctOptionId: string
  }
  shortResponse: {
    prompt: string
    placeholder: string
    requiredKeywords: string[]
    secondaryKeywords?: string[]
  }
  modelAnswer: string
}

export interface ExpectedTable {
  columns: string[]
  rows: TableRow[]
  compareMode?: 'exact' | 'unordered'
  numericTolerance?: number
}

export interface ValidatorSpec {
  outputVariable?: 'merged' | 'result'
  expectedOutput?: ExpectedTable
  requiredColumns?: string[]
  expectedRowCount?: number
  preserveBaseTable?: {
    rowCount: number
    nullColumns?: string[]
  }
  successMessage: string
}

export interface MissionDefinition {
  id: string
  packId: string
  sequence: number
  title: string
  subtitle: string
  scenario: string
  stakeholder: string
  brief: string
  whyItMatters: string
  requiredOutput: string
  learningObjectives: string[]
  availableTables: string[]
  requiredTables: string[]
  relationshipEdges: RelationshipEdge[]
  precheckQuestions: PrecheckQuestion[]
  starterCode: string
  codeRequired: boolean
  outputVariable: 'merged' | 'result' | 'optional'
  validator: ValidatorSpec
  hints: HintStep[]
  interpretation: InterpretationPrompt
  difficulty: 'Warm-up' | 'Core' | 'Advanced'
  victoryLabel: string
  sqlSeed?: string
}

export interface ScenarioPack {
  id: string
  title: string
  summary: string
  accent: string
  missions: MissionDefinition[]
}

export interface TablePreview {
  columns: string[]
  rows: TableRow[]
  rowCount: number
}

export interface PythonValuePreview {
  kind: 'value'
  name: string
  value: Primitive
}

export interface PythonTablePreview {
  kind: 'table'
  name: string
  columns: string[]
  rows: TableRow[]
  rowCount: number
}

export type PythonPreview = PythonTablePreview | PythonValuePreview | null

export interface MissionRunOutput {
  stdout: string
  error: string | null
  merged: PythonPreview
  result: PythonPreview
  durationMs: number
}

export interface ScoreBreakdown {
  technical: number
  analyst: number
  efficiency: number
  total: number
  precheck: number
  code: number
  interpretationChoice: number
  interpretationText: number
  feedback: string[]
  passed: boolean
}

export interface MissionSubmission {
  mission: MissionDefinition
  selectedAnswers: Record<string, string>
  interpretationChoice: string
  interpretationText: string
  hintsUsed: string[]
  attempts: number
  runOutput: MissionRunOutput | null
}

export interface SavedMissionProgress {
  missionId: string
  attempts: number
  bestScore: number
  lastScore: number
  passed: boolean
  hintsUsed: string[]
  selectedAnswers: Record<string, string>
  interpretationChoice: string
  interpretationText: string
  lastVisitedAt: string
}

export interface SavedProgress {
  version: number
  unlockedMissionIds: string[]
  missionProgress: Record<string, SavedMissionProgress>
  lastMissionId: string | null
}
