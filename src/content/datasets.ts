import type { DataTable, Primitive, RelationshipEdge, TableRow } from '../types/game'

function sqlLiteral(value: Primitive) {
  if (value === null) {
    return 'NULL'
  }

  if (typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0'
  }

  return `'${String(value).replace(/'/g, "''")}'`
}

export function buildSqlSeed(tables: DataTable[]) {
  return tables
    .map((table) => {
      const columnSql = table.schema
        .map((column) => `${column.name} ${column.type}`)
        .join(',\n  ')
      const inserts = table.rows
        .map((row) => {
          const columns = Object.keys(row).join(', ')
          const values = Object.values(row).map(sqlLiteral).join(', ')
          return `INSERT INTO ${table.name} (${columns}) VALUES (${values});`
        })
        .join('\n')

      return `CREATE TABLE ${table.name} (\n  ${columnSql}\n);\n${inserts}`
    })
    .join('\n\n')
}

const customers: DataTable = {
  name: 'customers',
  label: 'Customers',
  description: 'CRM profile data for active accounts.',
  schema: [
    { name: 'customer_id', type: 'INTEGER', role: 'primary' },
    { name: 'customer_name', type: 'TEXT', role: 'dimension' },
    { name: 'region', type: 'TEXT', role: 'dimension' },
    { name: 'signup_date', type: 'TEXT', role: 'dimension' },
    { name: 'segment', type: 'TEXT', role: 'dimension' },
  ],
  rows: [
    {
      customer_id: 1,
      customer_name: 'Ava Stone',
      region: 'East',
      signup_date: '2023-01-15',
      segment: 'SMB',
    },
    {
      customer_id: 2,
      customer_name: 'Ben Ortiz',
      region: 'West',
      signup_date: '2022-11-02',
      segment: 'Enterprise',
    },
    {
      customer_id: 3,
      customer_name: 'Chloe Kim',
      region: 'South',
      signup_date: '2024-02-20',
      segment: 'Startup',
    },
    {
      customer_id: 4,
      customer_name: 'Diego Patel',
      region: 'East',
      signup_date: '2023-06-18',
      segment: 'Enterprise',
    },
    {
      customer_id: 5,
      customer_name: 'Erin Lopez',
      region: 'Midwest',
      signup_date: '2024-05-05',
      segment: 'SMB',
    },
    {
      customer_id: 6,
      customer_name: 'Farah Ali',
      region: 'West',
      signup_date: '2024-08-22',
      segment: 'Startup',
    },
    {
      customer_id: 7,
      customer_name: 'Grace Chen',
      region: 'South',
      signup_date: '2022-09-10',
      segment: 'Enterprise',
    },
  ],
  keyHints: [
    'customer_id is unique in this table.',
    'region and segment are useful dimensions but not join keys.',
  ],
}

const orders: DataTable = {
  name: 'orders',
  label: 'Orders',
  description: 'Transactional order lines from the commerce platform.',
  schema: [
    {
      name: 'order_id',
      type: 'INTEGER',
      role: 'primary',
    },
    {
      name: 'customer_id',
      type: 'INTEGER',
      role: 'foreign',
      references: { table: 'customers', column: 'customer_id' },
    },
    {
      name: 'product_id',
      type: 'INTEGER',
      role: 'foreign',
      references: { table: 'products', column: 'product_id' },
    },
    { name: 'order_date', type: 'TEXT', role: 'dimension' },
    { name: 'quantity', type: 'INTEGER', role: 'metric' },
    { name: 'sales_amount', type: 'REAL', role: 'metric' },
  ],
  rows: [
    {
      order_id: 1001,
      customer_id: 1,
      product_id: 501,
      order_date: '2025-01-05',
      quantity: 2,
      sales_amount: 240,
    },
    {
      order_id: 1002,
      customer_id: 2,
      product_id: 502,
      order_date: '2025-01-07',
      quantity: 5,
      sales_amount: 950,
    },
    {
      order_id: 1003,
      customer_id: 2,
      product_id: 503,
      order_date: '2025-01-11',
      quantity: 1,
      sales_amount: 450,
    },
    {
      order_id: 1004,
      customer_id: 4,
      product_id: 501,
      order_date: '2025-01-12',
      quantity: 3,
      sales_amount: 360,
    },
    {
      order_id: 1005,
      customer_id: 5,
      product_id: 504,
      order_date: '2025-01-14',
      quantity: 4,
      sales_amount: 320,
    },
    {
      order_id: 1006,
      customer_id: 7,
      product_id: 502,
      order_date: '2025-01-17',
      quantity: 2,
      sales_amount: 380,
    },
    {
      order_id: 1007,
      customer_id: 1,
      product_id: 503,
      order_date: '2025-01-20',
      quantity: 1,
      sales_amount: 450,
    },
    {
      order_id: 1008,
      customer_id: 4,
      product_id: 504,
      order_date: '2025-01-24',
      quantity: 2,
      sales_amount: 160,
    },
    {
      order_id: 1009,
      customer_id: 7,
      product_id: 501,
      order_date: '2025-01-25',
      quantity: 1,
      sales_amount: 120,
    },
    {
      order_id: 1010,
      customer_id: 2,
      product_id: 504,
      order_date: '2025-01-30',
      quantity: 6,
      sales_amount: 480,
    },
  ],
  keyHints: [
    'order_id is unique for each order line.',
    'customer_id and product_id link this table to other departments.',
  ],
}

const products: DataTable = {
  name: 'products',
  label: 'Products',
  description: 'Product catalog attributes owned by merchandising.',
  schema: [
    { name: 'product_id', type: 'INTEGER', role: 'primary' },
    { name: 'product_name', type: 'TEXT', role: 'dimension' },
    { name: 'category', type: 'TEXT', role: 'dimension' },
    { name: 'unit_price', type: 'REAL', role: 'metric' },
  ],
  rows: [
    {
      product_id: 501,
      product_name: 'Workflow Pro',
      category: 'Automation',
      unit_price: 120,
    },
    {
      product_id: 502,
      product_name: 'Insight BI',
      category: 'Analytics',
      unit_price: 190,
    },
    {
      product_id: 503,
      product_name: 'Secure Vault',
      category: 'Security',
      unit_price: 450,
    },
    {
      product_id: 504,
      product_name: 'Support Plus',
      category: 'Services',
      unit_price: 80,
    },
    {
      product_id: 505,
      product_name: 'Forecast AI',
      category: 'AI',
      unit_price: 250,
    },
  ],
  keyHints: [
    'product_id is the catalog key.',
    'category is useful for analysis but not unique.',
  ],
}

const employees: DataTable = {
  name: 'employees',
  label: 'Employees',
  description: 'Core HRIS employee roster.',
  schema: [
    { name: 'employee_id', type: 'INTEGER', role: 'primary' },
    { name: 'employee_name', type: 'TEXT', role: 'dimension' },
    {
      name: 'department_id',
      type: 'INTEGER',
      role: 'foreign',
      references: { table: 'departments', column: 'department_id' },
    },
    { name: 'salary', type: 'REAL', role: 'metric' },
    { name: 'years_at_company', type: 'INTEGER', role: 'metric' },
  ],
  rows: [
    {
      employee_id: 201,
      employee_name: 'Maya Brooks',
      department_id: 10,
      salary: 88000,
      years_at_company: 4,
    },
    {
      employee_id: 202,
      employee_name: 'Noah Singh',
      department_id: 10,
      salary: 76000,
      years_at_company: 2,
    },
    {
      employee_id: 203,
      employee_name: 'Olivia Park',
      department_id: 20,
      salary: 132000,
      years_at_company: 6,
    },
    {
      employee_id: 204,
      employee_name: 'Paul Green',
      department_id: 20,
      salary: 118000,
      years_at_company: 5,
    },
    {
      employee_id: 205,
      employee_name: 'Quinn Baker',
      department_id: 20,
      salary: 99000,
      years_at_company: 3,
    },
    {
      employee_id: 206,
      employee_name: 'Rosa Diaz',
      department_id: 30,
      salary: 72000,
      years_at_company: 7,
    },
    {
      employee_id: 207,
      employee_name: 'Sam Carter',
      department_id: 40,
      salary: 91000,
      years_at_company: 4,
    },
    {
      employee_id: 208,
      employee_name: 'Tia Morgan',
      department_id: 40,
      salary: 87000,
      years_at_company: 1,
    },
    {
      employee_id: 209,
      employee_name: 'Uma Patel',
      department_id: 30,
      salary: 78000,
      years_at_company: 2,
    },
  ],
  keyHints: [
    'employee_id is unique.',
    'department_id groups people but repeats across many rows.',
  ],
}

const departments: DataTable = {
  name: 'departments',
  label: 'Departments',
  description: 'Reference data for department names and managers.',
  schema: [
    { name: 'department_id', type: 'INTEGER', role: 'primary' },
    { name: 'department_name', type: 'TEXT', role: 'dimension' },
    { name: 'manager_id', type: 'INTEGER', role: 'dimension' },
  ],
  rows: [
    { department_id: 10, department_name: 'Sales', manager_id: 9001 },
    { department_id: 20, department_name: 'Engineering', manager_id: 9002 },
    { department_id: 30, department_name: 'People Ops', manager_id: 9003 },
    { department_id: 40, department_name: 'Finance', manager_id: 9004 },
  ],
  keyHints: [
    'department_id is the shared key with employees.',
  ],
}

const performance: DataTable = {
  name: 'performance',
  label: 'Performance',
  description: 'Review outcomes and talent development metrics.',
  schema: [
    {
      name: 'employee_id',
      type: 'INTEGER',
      role: 'primary',
      references: { table: 'employees', column: 'employee_id' },
    },
    { name: 'review_score', type: 'REAL', role: 'metric' },
    { name: 'promoted', type: 'INTEGER', role: 'metric' },
    { name: 'training_hours', type: 'REAL', role: 'metric' },
  ],
  rows: [
    { employee_id: 201, review_score: 4.4, promoted: true, training_hours: 20 },
    { employee_id: 202, review_score: 3.9, promoted: false, training_hours: 12 },
    { employee_id: 203, review_score: 4.8, promoted: true, training_hours: 35 },
    { employee_id: 204, review_score: 4.6, promoted: true, training_hours: 28 },
    { employee_id: 205, review_score: 4.1, promoted: false, training_hours: 18 },
    { employee_id: 206, review_score: 4.0, promoted: false, training_hours: 24 },
    { employee_id: 207, review_score: 4.5, promoted: true, training_hours: 15 },
    { employee_id: 208, review_score: 3.7, promoted: false, training_hours: 10 },
  ],
  keyHints: [
    'Every review row belongs to one employee.',
    'Missing rows here mean some employees have no review yet.',
  ],
}

const students: DataTable = {
  name: 'students',
  label: 'Students',
  description: 'Enrollment records from the student information system.',
  schema: [
    { name: 'student_id', type: 'INTEGER', role: 'primary' },
    { name: 'student_name', type: 'TEXT', role: 'dimension' },
    {
      name: 'program_id',
      type: 'INTEGER',
      role: 'foreign',
      references: { table: 'programs', column: 'program_id' },
    },
    { name: 'attendance_pct', type: 'REAL', role: 'metric' },
  ],
  rows: [
    { student_id: 401, student_name: 'Alice Wong', program_id: 301, attendance_pct: 92 },
    { student_id: 402, student_name: 'Brian Lee', program_id: 301, attendance_pct: 87 },
    { student_id: 403, student_name: 'Carla Ruiz', program_id: 302, attendance_pct: 95 },
    { student_id: 404, student_name: 'Devon Hall', program_id: 302, attendance_pct: 78 },
    { student_id: 405, student_name: 'Elena Cruz', program_id: 303, attendance_pct: 90 },
    { student_id: 406, student_name: 'Felix Grant', program_id: 303, attendance_pct: 83 },
    { student_id: 407, student_name: 'Gia Rossi', program_id: 304, attendance_pct: 96 },
    { student_id: 408, student_name: 'Hugo Perez', program_id: 304, attendance_pct: 88 },
    { student_id: 409, student_name: 'Imani Cole', program_id: 302, attendance_pct: 91 },
  ],
  keyHints: [
    'student_id is the one-to-one key with scores.',
    'program_id connects to program metadata.',
  ],
}

const programs: DataTable = {
  name: 'programs',
  label: 'Programs',
  description: 'Reference table for academic program details.',
  schema: [
    { name: 'program_id', type: 'INTEGER', role: 'primary' },
    { name: 'program_name', type: 'TEXT', role: 'dimension' },
    { name: 'delivery_mode', type: 'TEXT', role: 'dimension' },
  ],
  rows: [
    { program_id: 301, program_name: 'Data Science Flex', delivery_mode: 'Online' },
    { program_id: 302, program_name: 'Business Analytics', delivery_mode: 'On-Campus' },
    { program_id: 303, program_name: 'Cybersecurity Bootcamp', delivery_mode: 'Hybrid' },
    { program_id: 304, program_name: 'Product Analytics', delivery_mode: 'Online' },
  ],
  keyHints: [
    'program_id is the shared key with students.',
  ],
}

const scores: DataTable = {
  name: 'scores',
  label: 'Scores',
  description: 'Assessment outcomes for each enrolled student.',
  schema: [
    {
      name: 'student_id',
      type: 'INTEGER',
      role: 'primary',
      references: { table: 'students', column: 'student_id' },
    },
    { name: 'exam_score', type: 'REAL', role: 'metric' },
    { name: 'assignment_avg', type: 'REAL', role: 'metric' },
    { name: 'passed', type: 'INTEGER', role: 'metric' },
  ],
  rows: [
    { student_id: 401, exam_score: 88, assignment_avg: 91, passed: true },
    { student_id: 402, exam_score: 74, assignment_avg: 79, passed: true },
    { student_id: 403, exam_score: 81, assignment_avg: 85, passed: true },
    { student_id: 404, exam_score: 67, assignment_avg: 72, passed: false },
    { student_id: 405, exam_score: 76, assignment_avg: 80, passed: true },
    { student_id: 406, exam_score: 59, assignment_avg: 68, passed: false },
    { student_id: 407, exam_score: 71, assignment_avg: 88, passed: true },
    { student_id: 408, exam_score: 65, assignment_avg: 70, passed: false },
    { student_id: 409, exam_score: 73, assignment_avg: 90, passed: true },
  ],
  keyHints: [
    'student_id appears once per score row.',
    'passed behaves like a boolean metric and can be averaged into pass rate.',
  ],
}

export const relationshipEdges: RelationshipEdge[] = [
  {
    id: 'customers-orders',
    from: 'customers',
    to: 'orders',
    key: 'customer_id',
    label: 'customer_id joins customers to orders',
  },
  {
    id: 'orders-products',
    from: 'orders',
    to: 'products',
    key: 'product_id',
    label: 'product_id joins orders to products',
  },
  {
    id: 'employees-departments',
    from: 'employees',
    to: 'departments',
    key: 'department_id',
    label: 'department_id joins employees to departments',
  },
  {
    id: 'employees-performance',
    from: 'employees',
    to: 'performance',
    key: 'employee_id',
    label: 'employee_id joins employees to performance',
  },
  {
    id: 'students-programs',
    from: 'students',
    to: 'programs',
    key: 'program_id',
    label: 'program_id joins students to programs',
  },
  {
    id: 'students-scores',
    from: 'students',
    to: 'scores',
    key: 'student_id',
    label: 'student_id joins students to scores',
  },
]

export const tableCatalog: Record<string, DataTable> = {
  customers,
  orders,
  products,
  employees,
  departments,
  performance,
  students,
  programs,
  scores,
}

export const scenarioTables = {
  ecommerce: [customers, orders, products],
  hr: [employees, departments, performance],
  school: [students, programs, scores],
}

export function getTables(tableNames: string[]) {
  return tableNames.map((name) => tableCatalog[name])
}

export function previewRows(rows: TableRow[], limit = 5) {
  return rows.slice(0, limit)
}
