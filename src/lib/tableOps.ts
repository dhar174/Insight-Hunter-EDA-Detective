import type { Primitive, TableRow } from '../types/game'

function comparePrimitive(a: Primitive, b: Primitive) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }

  return String(a).localeCompare(String(b))
}

export function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function innerJoin(
  leftRows: TableRow[],
  rightRows: TableRow[],
  leftKey: string,
  rightKey = leftKey,
) {
  const rightMap = new Map<Primitive, TableRow[]>()

  for (const row of rightRows) {
    const key = row[rightKey]
    const bucket = rightMap.get(key) ?? []
    bucket.push(row)
    rightMap.set(key, bucket)
  }

  return leftRows.flatMap((leftRow) =>
    (rightMap.get(leftRow[leftKey]) ?? []).map((rightRow) => ({
      ...leftRow,
      ...rightRow,
    })),
  )
}

export function leftJoin(
  leftRows: TableRow[],
  rightRows: TableRow[],
  leftKey: string,
  rightKey = leftKey,
) {
  const rightColumns = Array.from(
    new Set(rightRows.flatMap((row) => Object.keys(row))),
  )
  const rightMap = new Map<Primitive, TableRow[]>()

  for (const row of rightRows) {
    const key = row[rightKey]
    const bucket = rightMap.get(key) ?? []
    bucket.push(row)
    rightMap.set(key, bucket)
  }

  return leftRows.flatMap((leftRow) => {
    const matches = rightMap.get(leftRow[leftKey])

    if (!matches || matches.length === 0) {
      const nullRow = Object.fromEntries(
        rightColumns.map((column) => [column, null]),
      )

      return [{ ...nullRow, ...leftRow }]
    }

    return matches.map((rightRow) => ({
      ...rightRow,
      ...leftRow,
    }))
  })
}

interface AggregationSpec {
  field: string
  output: string
  op: 'sum' | 'mean'
}

function toNumber(value: Primitive) {
  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  return typeof value === 'number' ? value : 0
}

export function groupAndAggregate(
  rows: TableRow[],
  groupKeys: string[],
  aggregations: AggregationSpec[],
) {
  const groups = new Map<string, TableRow[]>()

  for (const row of rows) {
    const key = JSON.stringify(groupKeys.map((column) => row[column]))
    const bucket = groups.get(key) ?? []
    bucket.push(row)
    groups.set(key, bucket)
  }

  return Array.from(groups.entries()).map(([serializedKey, groupRows]) => {
    const keyValues = JSON.parse(serializedKey) as Primitive[]
    const base = Object.fromEntries(
      groupKeys.map((column, index) => [column, keyValues[index]]),
    )

    for (const aggregation of aggregations) {
      const values = groupRows.map((row) => toNumber(row[aggregation.field]))
      const total = values.reduce((sum, value) => sum + value, 0)
      base[aggregation.output] =
        aggregation.op === 'sum'
          ? roundTo(total, 2)
          : roundTo(total / Math.max(values.length, 1), 2)
    }

    return base
  })
}

export function sortRows(
  rows: TableRow[],
  sorters: Array<{ field: string; direction?: 'asc' | 'desc' }>,
) {
  return [...rows].sort((left, right) => {
    for (const sorter of sorters) {
      const direction = sorter.direction === 'asc' ? 1 : -1
      const comparison = comparePrimitive(left[sorter.field], right[sorter.field])

      if (comparison !== 0) {
        return comparison * direction
      }
    }

    return 0
  })
}

export function projectRows(rows: TableRow[], columns: string[]) {
  return rows.map((row) =>
    Object.fromEntries(columns.map((column) => [column, row[column]])),
  )
}
