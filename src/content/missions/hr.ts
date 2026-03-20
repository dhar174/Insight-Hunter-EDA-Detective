import { avgRows, departments, edges, employees, hrMerged, mission } from './shared'
import { groupAndAggregate, innerJoin, sortRows } from '../../lib/tableOps'

export const hrMissions = [
  mission({
    id: 'hr-review-scores',
    packId: 'hr',
    sequence: 7,
    title: 'Rate the Departments',
    subtitle: 'Use joins to blend roster, org, and review data.',
    scenario: 'HR Analytics',
    stakeholder: 'Chief People Officer',
    brief:
      'HR leadership wants to know which department is earning the strongest performance reviews on average.',
    whyItMatters:
      'No single HR table has the answer. You need org structure and review metrics together.',
    requiredOutput:
      'Return average review_score by department_name, sorted descending.',
    learningObjectives: [
      'Merge employees to departments and performance.',
      'Aggregate a quality metric by department.',
    ],
    availableTables: ['employees', 'departments', 'performance'],
    requiredTables: ['employees', 'departments', 'performance'],
    relationshipEdges: edges(['employees-departments', 'employees-performance']),
    precheckQuestions: [
      {
        id: 'hr-review-table',
        prompt: 'Which table contains review_score?',
        options: [
          { id: 'performance', label: 'performance' },
          { id: 'employees', label: 'employees' },
          { id: 'departments', label: 'departments' },
        ],
        correctOptionId: 'performance',
        concept: 'table',
      },
      {
        id: 'hr-review-join-key',
        prompt: 'Which key connects employees to performance?',
        options: [
          { id: 'employee_id', label: 'employee_id' },
          { id: 'department_id', label: 'department_id' },
          { id: 'manager_id', label: 'manager_id' },
        ],
        correctOptionId: 'employee_id',
        concept: 'key',
      },
    ],
    starterCode: `merged = employees.merge(departments, on="department_id").merge(performance, on="employee_id")
result = merged.groupby("department_name")["review_score"].mean().sort_values(ascending=False)
result`,
    codeRequired: true,
    outputVariable: 'result',
    validator: {
      outputVariable: 'result',
      expectedOutput: {
        columns: ['department_name', 'review_score'],
        rows: avgRows(hrMerged, 'department_name', 'review_score'),
        compareMode: 'exact',
      },
      requiredColumns: ['department_name', 'review_score'],
      successMessage:
        'You answered a real HR performance question by joining across org boundaries.',
    },
    hints: [
      {
        id: 'hr-review-hint-1',
        title: 'department_name is reference data',
        body: 'You need departments for names and performance for review_score.',
        cost: 2,
      },
    ],
    interpretation: {
      multipleChoice: {
        prompt: 'Which department leads on average review score?',
        options: [
          { id: 'engineering', label: 'Engineering' },
          { id: 'sales', label: 'Sales' },
          { id: 'finance', label: 'Finance' },
        ],
        correctOptionId: 'engineering',
      },
      shortResponse: {
        prompt: 'How should HR use this result responsibly?',
        placeholder:
          'Example: Study what is working in Engineering, but also review calibration and team context before copying policies everywhere.',
        requiredKeywords: ['engineering'],
        secondaryKeywords: ['calibration', 'context', 'hr', 'department'],
      },
      modelAnswer:
        'Engineering leads on review score, so HR should study what is working there while also checking review calibration and context before generalizing.',
    },
    difficulty: 'Core',
    victoryLabel: 'People Pulse Readout',
  }),
  mission({
    id: 'hr-salary',
    packId: 'hr',
    sequence: 8,
    title: 'Benchmark Salary by Department',
    subtitle: 'Combine structure data with compensation metrics.',
    scenario: 'HR Analytics',
    stakeholder: 'Finance Business Partner',
    brief:
      'Finance wants average salary by department to plan next quarter headcount and compensation review conversations.',
    whyItMatters:
      'This is a common finance-and-HR partnership question that blends organizational structure with numeric metrics.',
    requiredOutput: 'Return average salary by department_name, sorted descending.',
    learningObjectives: [
      'Merge employees with departments.',
      'Group and average a compensation metric.',
    ],
    availableTables: ['employees', 'departments'],
    requiredTables: ['employees', 'departments'],
    relationshipEdges: edges(['employees-departments']),
    precheckQuestions: [
      {
        id: 'hr-salary-dimension',
        prompt: 'Which table contains department_name?',
        options: [
          { id: 'departments', label: 'departments' },
          { id: 'employees', label: 'employees' },
          { id: 'performance', label: 'performance' },
        ],
        correctOptionId: 'departments',
        concept: 'table',
      },
      {
        id: 'hr-salary-metric',
        prompt: 'Which field should you average?',
        options: [
          { id: 'salary', label: 'salary' },
          { id: 'years', label: 'years_at_company' },
          { id: 'manager', label: 'manager_id' },
        ],
        correctOptionId: 'salary',
        concept: 'table',
      },
    ],
    starterCode: `merged = employees.merge(departments, on="department_id")
result = merged.groupby("department_name")["salary"].mean().sort_values(ascending=False)
result`,
    codeRequired: true,
    outputVariable: 'result',
    validator: {
      outputVariable: 'result',
      expectedOutput: {
        columns: ['department_name', 'salary'],
        rows: avgRows(
          innerJoin(employees, departments, 'department_id'),
          'department_name',
          'salary',
        ),
        compareMode: 'exact',
      },
      requiredColumns: ['department_name', 'salary'],
      successMessage:
        'You linked org structure and pay data into a finance-ready benchmark view.',
    },
    hints: [
      {
        id: 'hr-salary-hint-1',
        title: 'department_name does not live in employees',
        body: 'You need a merge to attach the readable department label before grouping.',
        cost: 2,
      },
    ],
    interpretation: {
      multipleChoice: {
        prompt: 'Which department has the highest average salary?',
        options: [
          { id: 'engineering', label: 'Engineering' },
          { id: 'finance', label: 'Finance' },
          { id: 'sales', label: 'Sales' },
        ],
        correctOptionId: 'engineering',
      },
      shortResponse: {
        prompt: 'What should finance keep in mind before overreacting to the ranking?',
        placeholder:
          'Example: Department mix, role seniority, and market rates can explain salary differences.',
        requiredKeywords: ['engineering'],
        secondaryKeywords: ['seniority', 'market', 'role', 'salary'],
      },
      modelAnswer:
        'Engineering leads on average salary, but finance should weigh role mix, seniority, and market-rate differences before treating that as a problem.',
    },
    difficulty: 'Core',
    victoryLabel: 'Comp Benchmark Built',
  }),
  mission({
    id: 'hr-training-promotion',
    packId: 'hr',
    sequence: 9,
    title: 'Compare Training and Promotions',
    subtitle: 'Aggregate multiple metrics from one joined frame.',
    scenario: 'HR Analytics',
    stakeholder: 'Talent Development Lead',
    brief:
      'Talent leadership wants to compare average training hours with promotion rates by department.',
    whyItMatters:
      'Real analyst questions often need two metrics from the same merged dataset, not just one ranked value.',
    requiredOutput:
      'Return average training_hours and promotion_rate by department_name, sorted by promotion_rate descending.',
    learningObjectives: [
      'Aggregate more than one metric from the same grouped data.',
      'Translate boolean outcomes into rates.',
    ],
    availableTables: ['employees', 'departments', 'performance'],
    requiredTables: ['employees', 'departments', 'performance'],
    relationshipEdges: edges(['employees-departments', 'employees-performance']),
    precheckQuestions: [
      {
        id: 'training-promotion-boolean',
        prompt: 'Which field can be averaged to produce a promotion rate?',
        options: [
          { id: 'promoted', label: 'promoted' },
          { id: 'review_score', label: 'review_score' },
          { id: 'manager_id', label: 'manager_id' },
        ],
        correctOptionId: 'promoted',
        concept: 'table',
      },
      {
        id: 'training-promotion-join',
        prompt: 'How many tables do you need for this question?',
        options: [
          { id: 'three', label: 'Three tables' },
          { id: 'two', label: 'Two tables' },
          { id: 'one', label: 'One table' },
        ],
        correctOptionId: 'three',
        concept: 'table',
      },
    ],
    starterCode: `merged = employees.merge(departments, on="department_id").merge(performance, on="employee_id")
result = merged.groupby("department_name").agg(
    avg_training_hours=("training_hours", "mean"),
    promotion_rate=("promoted", "mean"),
).sort_values("promotion_rate", ascending=False)
result`,
    codeRequired: true,
    outputVariable: 'result',
    validator: {
      outputVariable: 'result',
      expectedOutput: {
        columns: ['department_name', 'avg_training_hours', 'promotion_rate'],
        rows: sortRows(
          groupAndAggregate(hrMerged, ['department_name'], [
            {
              field: 'training_hours',
              output: 'avg_training_hours',
              op: 'mean',
            },
            { field: 'promoted', output: 'promotion_rate', op: 'mean' },
          ]),
          [
            { field: 'promotion_rate' },
            { field: 'avg_training_hours' },
          ],
        ),
        compareMode: 'exact',
      },
      requiredColumns: ['department_name', 'avg_training_hours', 'promotion_rate'],
      successMessage:
        'You built a multi-metric department comparison using one coherent joined dataset.',
    },
    hints: [
      {
        id: 'training-promotion-hint-1',
        title: 'Boolean means can become rates',
        body: 'promoted averages to a proportion when True and False are treated as 1 and 0.',
        cost: 2,
      },
      {
        id: 'training-promotion-hint-2',
        title: 'Use agg with named outputs',
        body: 'agg(avg_training_hours=("training_hours", "mean"), promotion_rate=("promoted", "mean")) is the right pattern.',
        cost: 3,
      },
    ],
    interpretation: {
      multipleChoice: {
        prompt:
          'Which department combines the highest promotion rate with the strongest training investment?',
        options: [
          { id: 'engineering', label: 'Engineering' },
          { id: 'sales', label: 'Sales' },
          { id: 'finance', label: 'Finance' },
        ],
        correctOptionId: 'engineering',
      },
      shortResponse: {
        prompt: 'What is the right interpretation of this relationship?',
        placeholder:
          'Example: Higher training and higher promotion rates appear together in Engineering, but this alone does not prove causation.',
        requiredKeywords: ['engineering'],
        secondaryKeywords: ['causation', 'training', 'promotion', 'relationship'],
      },
      modelAnswer:
        'Engineering pairs the strongest training investment with the highest promotion rate, but the result is only an association and not proof that training alone caused promotions.',
    },
    difficulty: 'Advanced',
    victoryLabel: 'Talent Signal Compared',
  }),
  mission({
    id: 'hr-missing-reviews',
    packId: 'hr',
    sequence: 10,
    title: 'Catch Missing Reviews',
    subtitle: 'Use a left join to reveal incomplete HR records.',
    scenario: 'HR Analytics',
    stakeholder: 'HR Operations Manager',
    brief:
      'HR Ops needs a clean list of employees missing a performance review before the audit deadline.',
    whyItMatters:
      'Data quality checks often rely on the same left join reasoning as retention or operations work.',
    requiredOutput:
      'Keep every employee, join performance reviews, and return rows with missing review_score.',
    learningObjectives: [
      'Use left join logic in a new business domain.',
      'Understand missing matches as an audit signal.',
    ],
    availableTables: ['employees', 'departments', 'performance'],
    requiredTables: ['employees', 'departments', 'performance'],
    relationshipEdges: edges(['employees-departments', 'employees-performance']),
    precheckQuestions: [
      {
        id: 'missing-reviews-base',
        prompt: 'Which table must be preserved to find employees with no review?',
        options: [
          { id: 'employees', label: 'employees' },
          { id: 'performance', label: 'performance' },
          { id: 'departments', label: 'departments' },
        ],
        correctOptionId: 'employees',
        concept: 'base',
      },
      {
        id: 'missing-reviews-null',
        prompt: 'Which field is the clearest null check after the left merge?',
        options: [
          { id: 'review_score', label: 'review_score' },
          { id: 'department_name', label: 'department_name' },
          { id: 'years_at_company', label: 'years_at_company' },
        ],
        correctOptionId: 'review_score',
        concept: 'table',
      },
    ],
    starterCode: `merged = employees.merge(departments, on="department_id").merge(performance, on="employee_id", how="left")
result = merged[merged["review_score"].isna()][["employee_name", "department_name"]]
result`,
    codeRequired: true,
    outputVariable: 'result',
    validator: {
      outputVariable: 'result',
      expectedOutput: {
        columns: ['employee_name', 'department_name'],
        rows: [{ employee_name: 'Uma Patel', department_name: 'People Ops' }],
        compareMode: 'exact',
      },
      requiredColumns: ['employee_name', 'department_name'],
      successMessage:
        'You used left join reasoning to flag an incomplete HR review record before audit season.',
    },
    hints: [
      {
        id: 'missing-reviews-hint-1',
        title: 'Preserve the roster',
        body: 'If an employee is missing a review, they disappear with an inner join. Start from employees.',
        cost: 2,
      },
    ],
    interpretation: {
      multipleChoice: {
        prompt: 'Which employee is missing a performance review?',
        options: [
          { id: 'uma', label: 'Uma Patel' },
          { id: 'maya', label: 'Maya Brooks' },
          { id: 'tia', label: 'Tia Morgan' },
        ],
        correctOptionId: 'uma',
      },
      shortResponse: {
        prompt: 'Why does this kind of audit question favor a left join?',
        placeholder:
          'Example: The missing rows are the point, so we must preserve all employees and look for null review fields.',
        requiredKeywords: ['left'],
        secondaryKeywords: ['employee', 'missing', 'null', 'review'],
      },
      modelAnswer:
        'A left join is the right fit because the audit cares about missing reviews, so every employee must stay in the result and null review fields become the signal.',
    },
    difficulty: 'Core',
    victoryLabel: 'Audit Gap Flagged',
  }),
]
