import { edges, mission, passRateRows, programPerformanceRows, schoolMerged } from './shared'
import { avgRows } from './shared'

export const schoolMissions = [
  mission({
    id: 'school-pass-rate',
    packId: 'school',
    sequence: 11,
    title: 'Find the Strongest Pass Rate',
    subtitle: 'Blend enrollment, program, and score data.',
    scenario: 'School Analytics',
    stakeholder: 'Academic Program Director',
    brief:
      'Program leadership wants to know which program currently has the highest pass rate.',
    whyItMatters:
      'Academic analytics often mirrors business analytics: enrollments, program metadata, and outcomes live in separate systems.',
    requiredOutput: 'Return pass_rate by program_name, sorted descending.',
    learningObjectives: [
      'Use boolean averages as rates in a new domain.',
      'Merge three tables to answer an educational outcomes question.',
    ],
    availableTables: ['students', 'programs', 'scores'],
    requiredTables: ['students', 'programs', 'scores'],
    relationshipEdges: edges(['students-programs', 'students-scores']),
    precheckQuestions: [
      {
        id: 'pass-rate-program-name',
        prompt: 'Which table contains program_name?',
        options: [
          { id: 'programs', label: 'programs' },
          { id: 'students', label: 'students' },
          { id: 'scores', label: 'scores' },
        ],
        correctOptionId: 'programs',
        concept: 'table',
      },
      {
        id: 'pass-rate-metric',
        prompt: 'Which field can be averaged into a pass rate?',
        options: [
          { id: 'passed', label: 'passed' },
          { id: 'exam_score', label: 'exam_score' },
          { id: 'attendance_pct', label: 'attendance_pct' },
        ],
        correctOptionId: 'passed',
        concept: 'table',
      },
    ],
    starterCode: `merged = students.merge(programs, on="program_id").merge(scores, on="student_id")
result = merged.groupby("program_name")["passed"].mean().sort_values(ascending=False)
result`,
    codeRequired: true,
    outputVariable: 'result',
    validator: {
      outputVariable: 'result',
      expectedOutput: {
        columns: ['program_name', 'passed'],
        rows: passRateRows(schoolMerged, 'program_name'),
        compareMode: 'exact',
      },
      requiredColumns: ['program_name', 'passed'],
      successMessage:
        'You joined student, program, and outcome data into a clean pass-rate leaderboard.',
    },
    hints: [
      {
        id: 'pass-rate-hint-1',
        title: 'Program labels need a merge',
        body: 'students has program_id, but programs translates that into the readable program_name.',
        cost: 2,
      },
    ],
    interpretation: {
      multipleChoice: {
        prompt: 'Which program has the highest pass rate?',
        options: [
          { id: 'ds-flex', label: 'Data Science Flex' },
          { id: 'business-analytics', label: 'Business Analytics' },
          { id: 'product-analytics', label: 'Product Analytics' },
        ],
        correctOptionId: 'ds-flex',
      },
      shortResponse: {
        prompt: 'How should the director use this result?',
        placeholder:
          'Example: Learn from Data Science Flex while checking whether the cohort size is large enough to treat as a stable pattern.',
        requiredKeywords: ['data science flex'],
        secondaryKeywords: ['cohort', 'program', 'pass', 'pattern'],
      },
      modelAnswer:
        'Data Science Flex leads on pass rate, so the director should study what is working there while also checking that the cohort is large enough to support a stable conclusion.',
    },
    difficulty: 'Core',
    victoryLabel: 'Program Leaderboard Published',
  }),
  mission({
    id: 'school-delivery-mode',
    packId: 'school',
    sequence: 12,
    title: 'Compare Delivery Modes',
    subtitle: 'Summarize performance at a program-system level.',
    scenario: 'School Analytics',
    stakeholder: 'Dean of Instruction',
    brief:
      'The dean wants to compare average exam scores across delivery modes to see whether any mode is lagging.',
    whyItMatters:
      'This is a classic grouped summary question where context tables explain outcome patterns.',
    requiredOutput: 'Return average exam_score by delivery_mode, sorted ascending.',
    learningObjectives: [
      'Group by a descriptive attribute from a reference table.',
      'Sort ascending when looking for underperformance.',
    ],
    availableTables: ['students', 'programs', 'scores'],
    requiredTables: ['students', 'programs', 'scores'],
    relationshipEdges: edges(['students-programs', 'students-scores']),
    precheckQuestions: [
      {
        id: 'delivery-mode-source',
        prompt: 'Which table supplies delivery_mode?',
        options: [
          { id: 'programs', label: 'programs' },
          { id: 'students', label: 'students' },
          { id: 'scores', label: 'scores' },
        ],
        correctOptionId: 'programs',
        concept: 'table',
      },
      {
        id: 'delivery-mode-sort',
        prompt: 'If leadership wants the lowest average first, how should you sort?',
        options: [
          { id: 'ascending', label: 'ascending' },
          { id: 'descending', label: 'descending' },
          { id: 'unsorted', label: 'Leave it unsorted' },
        ],
        correctOptionId: 'ascending',
        concept: 'table',
      },
    ],
    starterCode: `merged = students.merge(programs, on="program_id").merge(scores, on="student_id")
result = merged.groupby("delivery_mode")["exam_score"].mean().sort_values(ascending=True)
result`,
    codeRequired: true,
    outputVariable: 'result',
    validator: {
      outputVariable: 'result',
      expectedOutput: {
        columns: ['delivery_mode', 'exam_score'],
        rows: avgRows(schoolMerged, 'delivery_mode', 'exam_score', 'asc'),
        compareMode: 'exact',
      },
      requiredColumns: ['delivery_mode', 'exam_score'],
      successMessage:
        'You translated delivery-mode metadata into an actionable academic comparison.',
    },
    hints: [
      {
        id: 'delivery-mode-hint-1',
        title: 'Use programs for context',
        body: 'Exam scores live in scores, but delivery_mode lives in programs.',
        cost: 2,
      },
    ],
    interpretation: {
      multipleChoice: {
        prompt: 'Which delivery mode has the lowest average exam score?',
        options: [
          { id: 'hybrid', label: 'Hybrid' },
          { id: 'online', label: 'Online' },
          { id: 'on-campus', label: 'On-Campus' },
        ],
        correctOptionId: 'hybrid',
      },
      shortResponse: {
        prompt: 'What should the dean investigate next?',
        placeholder:
          'Example: Review whether hybrid cohorts face curriculum pacing or support issues that are pulling exam scores down.',
        requiredKeywords: ['hybrid'],
        secondaryKeywords: ['support', 'curriculum', 'exam', 'mode'],
      },
      modelAnswer:
        'Hybrid is lagging on exam score, so the dean should investigate whether the hybrid cohort needs pacing, support, or instructional design changes.',
    },
    difficulty: 'Advanced',
    victoryLabel: 'Mode Comparison Shared',
  }),
  mission({
    id: 'school-underperformance',
    packId: 'school',
    sequence: 13,
    title: 'Flag Hidden Underperformance',
    subtitle: 'Balance attendance, exam scores, and pass rate in one view.',
    scenario: 'School Analytics',
    stakeholder: 'Student Success Council',
    brief:
      'The council wants to know whether any program is underperforming despite strong attendance, so interventions can target the right cohort.',
    whyItMatters:
      'Sometimes the most important insight comes from comparing multiple metrics together instead of ranking one column.',
    requiredOutput:
      'Return average attendance, average exam score, and pass rate by program_name, sorted by average attendance descending.',
    learningObjectives: [
      'Aggregate multiple educational metrics together.',
      'Interpret tension between engagement and outcomes.',
    ],
    availableTables: ['students', 'programs', 'scores'],
    requiredTables: ['students', 'programs', 'scores'],
    relationshipEdges: edges(['students-programs', 'students-scores']),
    precheckQuestions: [
      {
        id: 'underperformance-metrics',
        prompt: 'How many metrics should appear in the final grouped result?',
        options: [
          { id: 'three', label: 'Three metrics' },
          { id: 'one', label: 'One metric' },
          { id: 'two', label: 'Two metrics' },
        ],
        correctOptionId: 'three',
        concept: 'table',
      },
      {
        id: 'underperformance-table-set',
        prompt: 'Which table contains attendance_pct?',
        options: [
          { id: 'students', label: 'students' },
          { id: 'scores', label: 'scores' },
          { id: 'programs', label: 'programs' },
        ],
        correctOptionId: 'students',
        concept: 'table',
      },
    ],
    starterCode: `merged = students.merge(programs, on="program_id").merge(scores, on="student_id")
result = merged.groupby("program_name").agg(
    avg_attendance=("attendance_pct", "mean"),
    avg_exam_score=("exam_score", "mean"),
    pass_rate=("passed", "mean"),
).sort_values("avg_attendance", ascending=False)
result`,
    codeRequired: true,
    outputVariable: 'result',
    validator: {
      outputVariable: 'result',
      expectedOutput: {
        columns: ['program_name', 'avg_attendance', 'avg_exam_score', 'pass_rate'],
        rows: programPerformanceRows(),
        compareMode: 'exact',
      },
      requiredColumns: ['program_name', 'avg_attendance', 'avg_exam_score', 'pass_rate'],
      successMessage:
        'You combined engagement and outcome metrics into a nuanced intervention view.',
    },
    hints: [
      {
        id: 'underperformance-hint-1',
        title: 'This is an agg mission',
        body: 'Use grouped named aggregations so all three metrics land in one result table.',
        cost: 2,
      },
    ],
    interpretation: {
      multipleChoice: {
        prompt: 'Which program looks most underperforming despite strong attendance?',
        options: [
          { id: 'product-analytics', label: 'Product Analytics' },
          { id: 'cybersecurity', label: 'Cybersecurity Bootcamp' },
          { id: 'data-science-flex', label: 'Data Science Flex' },
        ],
        correctOptionId: 'product-analytics',
      },
      shortResponse: {
        prompt: 'What makes this program the clearest intervention target?',
        placeholder:
          'Example: Product Analytics has the strongest attendance but still weak exam outcomes and only a 50% pass rate.',
        requiredKeywords: ['product analytics'],
        secondaryKeywords: ['attendance', 'exam', 'pass', 'intervention'],
      },
      modelAnswer:
        'Product Analytics is the clearest intervention target because attendance is strong, but exam performance and pass rate remain weak relative to that engagement.',
    },
    difficulty: 'Advanced',
    victoryLabel: 'Student Success Alert Raised',
  }),
]
