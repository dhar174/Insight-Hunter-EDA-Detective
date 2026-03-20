import { avgRows, edges, ecommerceMerged, mission, regionCategoryRevenue } from './shared'
import { groupAndAggregate, sortRows } from '../../lib/tableOps'

export const ecommerceAdvancedMissions = [
  mission({
    id: 'ecom-segment-sales',
    packId: 'ecommerce',
    sequence: 4,
    title: 'Rank the Customer Segments',
    subtitle: 'Merge and aggregate for the first real business answer.',
    scenario: 'E-commerce Operations',
    stakeholder: 'Chief Revenue Officer',
    brief:
      'Leadership wants to know which customer segment is driving the most sales so they can prioritize account strategy.',
    whyItMatters:
      'Joining and grouping is where raw tables become business decisions.',
    requiredOutput: 'Return total sales_amount by segment, sorted descending.',
    learningObjectives: [
      'Use groupby after merging related tables.',
      'Interpret grouped revenue results in business language.',
    ],
    availableTables: ['customers', 'orders'],
    requiredTables: ['customers', 'orders'],
    relationshipEdges: edges(['customers-orders']),
    precheckQuestions: [
      {
        id: 'segment-table',
        prompt: 'Which table contains the segment column needed for this request?',
        options: [
          { id: 'customers', label: 'customers' },
          { id: 'orders', label: 'orders' },
          { id: 'products', label: 'products' },
        ],
        correctOptionId: 'customers',
        concept: 'table',
      },
      {
        id: 'segment-metric',
        prompt: 'Which metric should you aggregate to answer “generated the most sales”?',
        options: [
          { id: 'sales_amount', label: 'sales_amount' },
          { id: 'quantity', label: 'quantity' },
          { id: 'customer_id', label: 'customer_id' },
        ],
        correctOptionId: 'sales_amount',
        concept: 'table',
      },
    ],
    starterCode: `merged = orders.merge(customers, on="customer_id", how="inner")
result = merged.groupby("segment")["sales_amount"].sum().sort_values(ascending=False)
result`,
    codeRequired: true,
    outputVariable: 'result',
    validator: {
      outputVariable: 'result',
      expectedOutput: {
        columns: ['segment', 'sales_amount'],
        rows: sortRows(
          groupAndAggregate(ecommerceMerged, ['segment'], [
            { field: 'sales_amount', output: 'sales_amount', op: 'sum' },
          ]),
          [{ field: 'sales_amount' }],
        ),
        compareMode: 'exact',
      },
      requiredColumns: ['segment', 'sales_amount'],
      successMessage:
        'You merged customer attributes onto revenue facts and surfaced the strongest segment.',
    },
    hints: [
      {
        id: 'segment-hint-1',
        title: 'Segment lives in customers',
        body: 'Orders has sales_amount, but segment comes from customers. Merge them first.',
        cost: 2,
      },
      {
        id: 'segment-hint-2',
        title: 'Think groupby then sum',
        body: 'After the merge, group by segment and sum sales_amount.',
        cost: 3,
      },
    ],
    interpretation: {
      multipleChoice: {
        prompt: 'Which segment generated the most sales in this dataset?',
        options: [
          { id: 'enterprise', label: 'Enterprise' },
          { id: 'smb', label: 'SMB' },
          { id: 'startup', label: 'Startup' },
        ],
        correctOptionId: 'enterprise',
      },
      shortResponse: {
        prompt: 'What follow-up should leadership investigate next?',
        placeholder:
          'Example: Check whether Enterprise wins because of larger order sizes, higher order frequency, or both.',
        requiredKeywords: ['enterprise'],
        secondaryKeywords: ['frequency', 'order', 'size', 'leadership'],
      },
      modelAnswer:
        'Enterprise generated the most sales, so leadership should study whether that lead comes from larger orders, higher order frequency, or both.',
    },
    difficulty: 'Core',
    victoryLabel: 'Segment Story Delivered',
  }),
  mission({
    id: 'ecom-region-category',
    packId: 'ecommerce',
    sequence: 5,
    title: 'Map Revenue by Region and Category',
    subtitle: 'Chain multiple merges into a richer business view.',
    scenario: 'E-commerce Operations',
    stakeholder: 'VP of Sales',
    brief:
      'The sales VP wants a region-by-category revenue breakdown to decide where product marketing support should land first.',
    whyItMatters:
      'Multi-table questions are where analysts prove they can connect the whole business graph, not just one pair of tables.',
    requiredOutput:
      'Merge orders with customers and products, then sum sales_amount by region and category.',
    learningObjectives: [
      'Chain two merge operations cleanly.',
      'Use multi-key grouping for richer business slices.',
    ],
    availableTables: ['customers', 'orders', 'products'],
    requiredTables: ['customers', 'orders', 'products'],
    relationshipEdges: edges(['customers-orders', 'orders-products']),
    precheckQuestions: [
      {
        id: 'region-category-tables',
        prompt: 'Which table supplies category?',
        options: [
          { id: 'products', label: 'products' },
          { id: 'customers', label: 'customers' },
          { id: 'orders', label: 'orders' },
        ],
        correctOptionId: 'products',
        concept: 'table',
      },
      {
        id: 'region-category-second-merge',
        prompt: 'After enriching orders with customers, what should you merge next to add category?',
        options: [
          { id: 'products', label: 'products on product_id' },
          { id: 'customers', label: 'customers again on customer_id' },
          { id: 'orders', label: 'orders again on order_id' },
        ],
        correctOptionId: 'products',
        concept: 'table',
      },
    ],
    starterCode: `merged = orders.merge(customers, on="customer_id").merge(products, on="product_id")
result = merged.groupby(["region", "category"])["sales_amount"].sum().sort_values(ascending=False)
result`,
    codeRequired: true,
    outputVariable: 'result',
    validator: {
      outputVariable: 'result',
      expectedOutput: {
        columns: ['region', 'category', 'sales_amount'],
        rows: regionCategoryRevenue(),
        compareMode: 'exact',
      },
      requiredColumns: ['region', 'category', 'sales_amount'],
      successMessage:
        'You stitched together three departments and produced the leadership-ready revenue cut.',
    },
    hints: [
      {
        id: 'region-category-hint-1',
        title: 'Start with orders as the fact table',
        body: 'Orders has the sales metric, so enrich it with customers and products.',
        cost: 2,
      },
      {
        id: 'region-category-hint-2',
        title: 'You need two keys',
        body: 'Use customer_id to pull region, then product_id to pull category.',
        cost: 3,
      },
    ],
    interpretation: {
      multipleChoice: {
        prompt: 'Which region-category combination brought in the most revenue?',
        options: [
          { id: 'west-analytics', label: 'West / Analytics' },
          { id: 'east-automation', label: 'East / Automation' },
          { id: 'west-security', label: 'West / Security' },
        ],
        correctOptionId: 'west-analytics',
      },
      shortResponse: {
        prompt: 'What should the VP focus on first based on this result?',
        placeholder:
          'Example: Protect West / Analytics momentum and study whether similar tactics could lift other regions.',
        requiredKeywords: ['west'],
        secondaryKeywords: ['analytics', 'focus', 'region', 'category'],
      },
      modelAnswer:
        'West / Analytics is the top revenue pocket, so the VP should protect that momentum and test whether its motion can be replicated in other regions or categories.',
    },
    difficulty: 'Advanced',
    victoryLabel: 'Cross-Functional Revenue Map',
  }),
  mission({
    id: 'ecom-order-value',
    packId: 'ecommerce',
    sequence: 6,
    title: 'Brief Leadership on Order Value',
    subtitle: 'Translate grouped output into a recommendation.',
    scenario: 'E-commerce Operations',
    stakeholder: 'Executive Leadership Team',
    brief:
      'Leadership needs to know which regions have the highest average order value and what that implies for commercial focus.',
    whyItMatters:
      'Strong analysts do not stop at the table. They explain what the numbers should trigger next.',
    requiredOutput: 'Return average sales_amount by region, sorted descending.',
    learningObjectives: [
      'Use mean aggregation after a merge.',
      'Interpret the leading region in business terms.',
    ],
    availableTables: ['customers', 'orders'],
    requiredTables: ['customers', 'orders'],
    relationshipEdges: edges(['customers-orders']),
    precheckQuestions: [
      {
        id: 'aov-region-source',
        prompt: 'Which table adds region to each order?',
        options: [
          { id: 'customers', label: 'customers' },
          { id: 'orders', label: 'orders' },
          { id: 'products', label: 'products' },
        ],
        correctOptionId: 'customers',
        concept: 'table',
      },
      {
        id: 'aov-agg',
        prompt: 'Which aggregation answers “average order value”?',
        options: [
          { id: 'mean', label: 'mean()' },
          { id: 'sum', label: 'sum()' },
          { id: 'count', label: 'count()' },
        ],
        correctOptionId: 'mean',
        concept: 'table',
      },
    ],
    starterCode: `merged = orders.merge(customers, on="customer_id", how="inner")
result = merged.groupby("region")["sales_amount"].mean().sort_values(ascending=False)
result`,
    codeRequired: true,
    outputVariable: 'result',
    validator: {
      outputVariable: 'result',
      expectedOutput: {
        columns: ['region', 'sales_amount'],
        rows: avgRows(ecommerceMerged, 'region', 'sales_amount'),
        compareMode: 'exact',
      },
      requiredColumns: ['region', 'sales_amount'],
      successMessage:
        'You turned merged order data into an executive-level pricing and market signal.',
    },
    hints: [
      {
        id: 'aov-hint-1',
        title: 'Merge first, average second',
        body: 'Orders has the metric, customers has region. Bring them together before grouping.',
        cost: 2,
      },
    ],
    interpretation: {
      multipleChoice: {
        prompt: 'Which region has the highest average order value?',
        options: [
          { id: 'west', label: 'West' },
          { id: 'midwest', label: 'Midwest' },
          { id: 'east', label: 'East' },
        ],
        correctOptionId: 'west',
      },
      shortResponse: {
        prompt: 'Give one practical leadership recommendation from this output.',
        placeholder:
          'Example: Study why West orders are larger and see whether pricing, mix, or customer composition can inform other regions.',
        requiredKeywords: ['west'],
        secondaryKeywords: ['pricing', 'mix', 'order', 'region'],
      },
      modelAnswer:
        'West leads in average order value, so leadership should investigate whether product mix, pricing, or customer composition there can inform other regions.',
    },
    difficulty: 'Advanced',
    victoryLabel: 'Executive Brief Approved',
  }),
]
