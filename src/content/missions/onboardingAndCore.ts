import { buildSqlSeed, scenarioTables } from '../datasets'
import { mission, edges, orders, ecommerceMerged, sqlPreviewRows, missingCustomerRows } from './shared'

export const onboardingAndCoreMissions = [
  mission({
    id: 'sql-load-warehouse',
    packId: 'onboarding',
    sequence: 0,
    title: 'Boot the Warehouse Feed',
    subtitle: 'Load SQL tables into pandas before analysis begins.',
    scenario: 'Onboarding',
    stakeholder: 'Data Platform Lead',
    brief:
      'The analytics sandbox is empty. Pull the ecommerce tables from SQLite into pandas so the rest of the team can explore them.',
    whyItMatters:
      'Analysts rarely start with a perfect DataFrame. They often begin with SQL tables and need to load them cleanly.',
    requiredOutput:
      'Load customers, orders, and products from conn, then show the first three customer rows as result.',
    learningObjectives: [
      'Use pd.read_sql against a SQLite connection.',
      'Recognize that SQL tables become DataFrames before merging.',
    ],
    availableTables: ['customers', 'orders', 'products'],
    requiredTables: ['customers', 'orders', 'products'],
    relationshipEdges: edges(['customers-orders', 'orders-products']),
    precheckQuestions: [
      {
        id: 'sql-load-source',
        prompt: 'Which object already gives you access to the SQLite database?',
        options: [
          { id: 'conn', label: 'conn' },
          { id: 'customers', label: 'customers' },
          { id: 'orders', label: 'orders' },
        ],
        correctOptionId: 'conn',
        concept: 'table',
      },
      {
        id: 'sql-load-function',
        prompt: 'Which pandas function mirrors a SQL query result flowing into a DataFrame?',
        options: [
          { id: 'read_sql', label: 'pd.read_sql(...)' },
          { id: 'merge', label: 'pd.merge(...)' },
          { id: 'concat', label: 'pd.concat(...)' },
        ],
        correctOptionId: 'read_sql',
        concept: 'table',
      },
    ],
    starterCode: `import pandas as pd

customers = pd.read_sql("SELECT * FROM customers", conn)
orders = pd.read_sql("SELECT * FROM orders", conn)
products = pd.read_sql("SELECT * FROM products", conn)

result = customers[["customer_id", "customer_name", "segment"]].head(3)
result`,
    codeRequired: true,
    outputVariable: 'result',
    validator: {
      outputVariable: 'result',
      expectedOutput: {
        columns: ['customer_id', 'customer_name', 'segment'],
        rows: sqlPreviewRows(),
        compareMode: 'exact',
      },
      requiredColumns: ['customer_id', 'customer_name', 'segment'],
      expectedRowCount: 3,
      successMessage:
        'You turned live SQL tables into pandas DataFrames and proved the pipeline is ready.',
    },
    hints: [
      {
        id: 'sql-hint-1',
        title: 'Start from the connection',
        body: 'The SQLite database is already open for you as conn.',
        cost: 2,
      },
      {
        id: 'sql-hint-2',
        title: 'Use a SELECT query',
        body: 'Try pd.read_sql("SELECT * FROM customers", conn) and repeat for the other tables.',
        cost: 3,
      },
    ],
    interpretation: {
      multipleChoice: {
        prompt: 'Why is this load step valuable before the join missions start?',
        options: [
          {
            id: 'mc-correct',
            label: 'Because analysts often pull data from SQL first, then manipulate it with pandas.',
          },
          {
            id: 'mc-wrong-1',
            label: 'Because merge only works on raw SQL tables, not DataFrames.',
          },
          {
            id: 'mc-wrong-2',
            label: 'Because SQL automatically computes the final groupby output.',
          },
        ],
        correctOptionId: 'mc-correct',
      },
      shortResponse: {
        prompt: 'Explain the handoff from SQL to pandas in one analyst-style sentence.',
        placeholder:
          'Example: We queried the operational tables into pandas so we could join and summarize them in Python.',
        requiredKeywords: ['sql', 'pandas'],
        secondaryKeywords: ['query', 'dataframe', 'python'],
      },
      modelAnswer:
        'We queried the source tables from SQL into pandas DataFrames so we could inspect, merge, and summarize them in Python.',
    },
    difficulty: 'Warm-up',
    victoryLabel: 'Warehouse Access Granted',
    sqlSeed: buildSqlSeed(scenarioTables.ecommerce),
  }),
  mission({
    id: 'ecom-keys',
    packId: 'ecommerce',
    sequence: 1,
    title: 'Find the Connecting Key',
    subtitle: 'Inspect schemas before you write code.',
    scenario: 'E-commerce Operations',
    stakeholder: 'VP of Sales Operations',
    brief:
      'Before anyone merges tables, leadership wants to know whether you can identify the fields that actually connect the systems.',
    whyItMatters:
      'Wrong keys create duplicated or missing rows. Good analysts slow down and verify relationships first.',
    requiredOutput:
      'Pick the correct key and base table so you can preserve the right records later.',
    learningObjectives: [
      'Identify the join key between customers and orders.',
      'Recognize which table contains region and segment attributes.',
    ],
    availableTables: ['customers', 'orders'],
    requiredTables: ['customers', 'orders'],
    relationshipEdges: edges(['customers-orders']),
    precheckQuestions: [
      {
        id: 'ecom-key-column',
        prompt: 'Which column connects customers to orders?',
        options: [
          { id: 'customer_id', label: 'customer_id' },
          { id: 'order_id', label: 'order_id' },
          { id: 'region', label: 'region' },
        ],
        correctOptionId: 'customer_id',
        concept: 'key',
      },
      {
        id: 'ecom-region-table',
        prompt: 'Which table do you need if you want region beside each order?',
        options: [
          { id: 'customers', label: 'customers' },
          { id: 'orders', label: 'orders' },
          { id: 'products', label: 'products' },
        ],
        correctOptionId: 'customers',
        concept: 'table',
      },
      {
        id: 'ecom-preserve-orders',
        prompt:
          'If the question is “which region did each order come from?”, which table is the best starting point?',
        options: [
          { id: 'orders', label: 'orders' },
          { id: 'customers', label: 'customers' },
          { id: 'either', label: 'Either one always gives the same answer' },
        ],
        correctOptionId: 'orders',
        concept: 'base',
      },
    ],
    starterCode:
      '# This mission is about planning the merge before you code.\n# Explore the tables, answer the questions, then move on.',
    codeRequired: false,
    outputVariable: 'optional',
    validator: {
      successMessage:
        'You mapped the keys correctly, which is the first win in any multi-table workflow.',
    },
    hints: [
      {
        id: 'ecom-keys-hint-1',
        title: 'Look for repeated business identifiers',
        body: 'order_id is unique per order, but customer_id appears in both tables.',
        cost: 2,
      },
    ],
    interpretation: {
      multipleChoice: {
        prompt: 'Why is order_id not the right join key between customers and orders?',
        options: [
          {
            id: 'mc-correct',
            label: 'Because order_id is unique to orders, while customer_id is the shared identifier.',
          },
          {
            id: 'mc-wrong-1',
            label: 'Because order_id only works for left joins.',
          },
          {
            id: 'mc-wrong-2',
            label: 'Because pandas blocks merges on columns ending in _id.',
          },
        ],
        correctOptionId: 'mc-correct',
      },
      shortResponse: {
        prompt: 'Describe how you spotted the true relationship key.',
        placeholder:
          'Example: I looked for the field that appears in both tables and represents the same business entity.',
        requiredKeywords: ['customer_id'],
        secondaryKeywords: ['both', 'table', 'shared', 'key'],
      },
      modelAnswer:
        'customer_id is the shared identifier across both tables, so it is the reliable relationship key for customer-level analysis.',
    },
    difficulty: 'Warm-up',
    victoryLabel: 'Key Pattern Spotted',
  }),
  mission({
    id: 'ecom-inner-merge',
    packId: 'ecommerce',
    sequence: 2,
    title: 'Add Region to Every Order',
    subtitle: 'Write your first real merge.',
    scenario: 'E-commerce Operations',
    stakeholder: 'Regional Sales Director',
    brief:
      'The team wants a joined order table so they can see the region attached to each transaction.',
    whyItMatters:
      'This is the everyday analyst move: enrich a fact table with descriptive attributes from a dimension table.',
    requiredOutput:
      'Combine orders with customers so merged contains region for every order.',
    learningObjectives: [
      'Use merge() with the correct shared key.',
      'Understand why an inner join keeps only matched order rows.',
    ],
    availableTables: ['customers', 'orders'],
    requiredTables: ['customers', 'orders'],
    relationshipEdges: edges(['customers-orders']),
    precheckQuestions: [
      {
        id: 'ecom-inner-key',
        prompt: 'Which field should go inside on="..." for this merge?',
        options: [
          { id: 'customer_id', label: 'customer_id' },
          { id: 'order_id', label: 'order_id' },
          { id: 'region', label: 'region' },
        ],
        correctOptionId: 'customer_id',
        concept: 'key',
      },
      {
        id: 'ecom-inner-join',
        prompt: 'Which join type fits when we only care about orders that actually exist?',
        options: [
          { id: 'inner', label: 'inner' },
          { id: 'left', label: 'left from customers' },
          { id: 'outer', label: 'outer' },
        ],
        correctOptionId: 'inner',
        concept: 'join',
      },
    ],
    starterCode: `merged = orders.merge(
    customers,
    on="customer_id",
    how="inner",
)

result = merged[["order_id", "region", "sales_amount"]].head()
result`,
    codeRequired: true,
    outputVariable: 'merged',
    validator: {
      outputVariable: 'merged',
      expectedOutput: {
        columns: Object.keys(ecommerceMerged[0]),
        rows: ecommerceMerged,
        compareMode: 'exact',
      },
      requiredColumns: ['order_id', 'customer_id', 'region', 'sales_amount'],
      expectedRowCount: orders.length,
      successMessage:
        'You enriched the order facts with customer geography using a clean inner merge.',
    },
    hints: [
      {
        id: 'ecom-inner-hint-1',
        title: 'Start from orders',
        body: 'Orders is the base table because the business question is about every order row.',
        cost: 2,
      },
      {
        id: 'ecom-inner-hint-2',
        title: 'Bring in region from customers',
        body: 'orders.merge(customers, on="customer_id", how="inner") is the exact shape you need.',
        cost: 3,
      },
    ],
    interpretation: {
      multipleChoice: {
        prompt: 'What does the inner join guarantee in this mission?',
        options: [
          {
            id: 'mc-correct',
            label: 'Every output row is a real order with a matching customer record.',
          },
          {
            id: 'mc-wrong-1',
            label: 'Every customer will appear even if they never ordered.',
          },
          {
            id: 'mc-wrong-2',
            label: 'The merge automatically removes duplicate customers from CRM.',
          },
        ],
        correctOptionId: 'mc-correct',
      },
      shortResponse: {
        prompt: 'Explain why orders was the right base table.',
        placeholder:
          'Example: The question asks for region on each order, so every order row needs to be preserved.',
        requiredKeywords: ['order'],
        secondaryKeywords: ['preserve', 'region', 'base'],
      },
      modelAnswer:
        'Orders was the correct base table because the business request asked for region on each order, so every transaction row had to stay in the output.',
    },
    difficulty: 'Core',
    victoryLabel: 'Merge Console Online',
  }),
  mission({
    id: 'ecom-left-join',
    packId: 'ecommerce',
    sequence: 3,
    title: 'Spot the Missing Customers',
    subtitle: 'Use a left join to preserve the base population.',
    scenario: 'E-commerce Operations',
    stakeholder: 'Lifecycle Marketing Manager',
    brief:
      'Marketing wants a list of customers who signed up but still have zero orders so they can run a nurture campaign.',
    whyItMatters:
      'This is the practical reason left joins matter: sometimes the missing records are the insight.',
    requiredOutput:
      'Keep every customer, join any orders they have, and return only customers missing an order_id.',
    learningObjectives: [
      'Choose the correct base table for a left join.',
      'Understand how nulls signal missing matches.',
    ],
    availableTables: ['customers', 'orders'],
    requiredTables: ['customers', 'orders'],
    relationshipEdges: edges(['customers-orders']),
    precheckQuestions: [
      {
        id: 'ecom-left-base',
        prompt:
          'Which table should be on the left side of the merge if we must keep every customer?',
        options: [
          { id: 'customers', label: 'customers' },
          { id: 'orders', label: 'orders' },
          { id: 'products', label: 'products' },
        ],
        correctOptionId: 'customers',
        concept: 'base',
      },
      {
        id: 'ecom-left-join-type',
        prompt: 'Which join type should preserve customers with no matches?',
        options: [
          { id: 'left', label: 'left' },
          { id: 'inner', label: 'inner' },
          { id: 'right', label: 'right' },
        ],
        correctOptionId: 'left',
        concept: 'join',
      },
    ],
    starterCode: `merged = customers.merge(
    orders,
    on="customer_id",
    how="left",
)

result = merged[merged["order_id"].isna()][["customer_name", "region"]]
result`,
    codeRequired: true,
    outputVariable: 'result',
    validator: {
      outputVariable: 'result',
      expectedOutput: {
        columns: ['customer_name', 'region'],
        rows: missingCustomerRows(),
        compareMode: 'exact',
      },
      requiredColumns: ['customer_name', 'region'],
      successMessage:
        'You preserved the entire customer population and surfaced the missing matches as null order rows.',
    },
    hints: [
      {
        id: 'ecom-left-hint-1',
        title: 'Read the business intent literally',
        body: 'If the goal says “find customers even if they never ordered,” customers must be the base table.',
        cost: 2,
      },
      {
        id: 'ecom-left-hint-2',
        title: 'Null order_id is the clue',
        body: 'After the left merge, filter rows where order_id is null to isolate non-ordering customers.',
        cost: 3,
      },
    ],
    interpretation: {
      multipleChoice: {
        prompt: 'What would an inner join do to Chloe Kim and Farah Ali here?',
        options: [
          {
            id: 'mc-correct',
            label: 'It would drop them, because they have no matching order rows.',
          },
          {
            id: 'mc-wrong-1',
            label: 'It would keep them and fill order_id with zero.',
          },
          {
            id: 'mc-wrong-2',
            label: 'It would duplicate them into every unmatched order.',
          },
        ],
        correctOptionId: 'mc-correct',
      },
      shortResponse: {
        prompt: 'Explain why the left join was necessary for this marketing question.',
        placeholder:
          'Example: Marketing cares about missing orders, so the customer list must stay intact even without matches.',
        requiredKeywords: ['customer', 'left'],
        secondaryKeywords: ['missing', 'order', 'preserve'],
      },
      modelAnswer:
        'The left join was necessary because marketing needed to preserve every customer and use missing order matches to find who still has zero purchases.',
    },
    difficulty: 'Core',
    victoryLabel: 'Retention Leads Uncovered',
  }),
]
