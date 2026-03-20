import { getTables, relationshipEdges, scenarioTables } from '../datasets'
import {
  groupAndAggregate,
  innerJoin,
  leftJoin,
  projectRows,
  roundTo,
  sortRows,
} from '../../lib/tableOps'
import type { MissionDefinition, TableRow } from '../../types/game'

export const customers = scenarioTables.ecommerce[0].rows
export const orders = scenarioTables.ecommerce[1].rows
export const products = scenarioTables.ecommerce[2].rows
export const employees = scenarioTables.hr[0].rows
export const departments = scenarioTables.hr[1].rows
export const performance = scenarioTables.hr[2].rows
export const students = scenarioTables.school[0].rows
export const programs = scenarioTables.school[1].rows
export const scores = scenarioTables.school[2].rows

export const ecommerceMerged = innerJoin(orders, customers, 'customer_id')
export const ecommerceThreeWay = innerJoin(ecommerceMerged, products, 'product_id')
export const hrMerged = innerJoin(
  innerJoin(employees, departments, 'department_id'),
  performance,
  'employee_id',
)
export const schoolMerged = innerJoin(
  innerJoin(students, programs, 'program_id'),
  scores,
  'student_id',
)

export function edges(ids: string[]) {
  return relationshipEdges.filter((edge) => ids.includes(edge.id))
}

export function mission(definition: MissionDefinition) {
  return definition
}

export function passRateRows(rows: TableRow[], key: string, metric = 'passed') {
  return sortRows(
    groupAndAggregate(rows, [key], [{ field: metric, output: metric, op: 'mean' }]),
    [
      { field: metric },
      { field: key, direction: 'asc' },
    ],
  )
}

export function avgRows(rows: TableRow[], key: string, metric: string, direction: 'asc' | 'desc' = 'desc') {
  return sortRows(
    groupAndAggregate(rows, [key], [{ field: metric, output: metric, op: 'mean' }]),
    [{ field: metric, direction }],
  )
}

export function sqlPreviewRows() {
  return projectRows(customers.slice(0, 3), [
    'customer_id',
    'customer_name',
    'segment',
  ])
}

export function missingCustomerRows() {
  return projectRows(
    leftJoin(customers, orders, 'customer_id')
      .filter((row) => row.order_id === null)
      .map((row) => ({
        customer_name: row.customer_name,
        region: row.region,
      })),
    ['customer_name', 'region'],
  )
}

export function regionCategoryRevenue() {
  return sortRows(
    groupAndAggregate(ecommerceThreeWay, ['region', 'category'], [
      { field: 'sales_amount', output: 'sales_amount', op: 'sum' },
    ]),
    [
      { field: 'sales_amount' },
      { field: 'region', direction: 'asc' },
      { field: 'category', direction: 'asc' },
    ],
  )
}

export function programPerformanceRows() {
  return sortRows(
    groupAndAggregate(schoolMerged, ['program_name'], [
      { field: 'attendance_pct', output: 'avg_attendance', op: 'mean' },
      { field: 'exam_score', output: 'avg_exam_score', op: 'mean' },
      { field: 'passed', output: 'pass_rate', op: 'mean' },
    ]),
    [{ field: 'avg_attendance' }],
  ).map((row) => ({
    ...row,
    avg_attendance: roundTo(Number(row.avg_attendance), 2),
    avg_exam_score: roundTo(Number(row.avg_exam_score), 2),
    pass_rate: roundTo(Number(row.pass_rate), 2),
  })) as TableRow[]
}

export function getMissionTables(missionDef: MissionDefinition) {
  return getTables(missionDef.availableTables)
}
