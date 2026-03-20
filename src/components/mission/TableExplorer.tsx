import type { DataTable, TablePreview } from '../../types/game'

interface TableExplorerProps {
  tables: DataTable[]
  previews: Record<string, TablePreview>
  selectedTable: string
  onSelectTable: (tableName: string) => void
}

export function TableExplorer({
  tables,
  previews,
  selectedTable,
  onSelectTable,
}: TableExplorerProps) {
  const activeTable = tables.find((table) => table.name === selectedTable) ?? tables[0]
  const activePreview = previews[activeTable.name]

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">2. Table Explorer</span>
          <h2>{activeTable.label}</h2>
        </div>
        <div className="chip-row">
          {tables.map((table) => (
            <button
              key={table.name}
              className={`chip ${selectedTable === table.name ? 'chip-active' : ''}`}
              onClick={() => onSelectTable(table.name)}
              type="button"
            >
              {table.label}
            </button>
          ))}
        </div>
      </div>

      <p className="panel-copy">{activeTable.description}</p>

      <div className="split-grid">
        <div>
          <h3>Schema</h3>
          <div className="schema-list">
            {activeTable.schema.map((column) => (
              <div key={column.name} className="schema-row">
                <code>{column.name}</code>
                <span>{column.type}</span>
                {column.role ? <span className="role-pill">{column.role}</span> : null}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3>Key Hints</h3>
          <ul className="plain-list">
            {activeTable.keyHints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
          <p className="subtle-copy">
            Rows loaded: <strong>{activePreview?.rowCount ?? activeTable.rows.length}</strong>
          </p>
        </div>
      </div>

      <div className="preview-table-wrap">
        <h3>Sample Rows</h3>
        {activePreview ? (
          <table className="data-table">
            <thead>
              <tr>
                {activePreview.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activePreview.rows.map((row, rowIndex) => (
                <tr key={`${activeTable.name}-${rowIndex}`}>
                  {activePreview.columns.map((column) => (
                    <td key={column}>{String(row[column] ?? 'null')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="subtle-copy">Loading preview...</p>
        )}
      </div>
    </section>
  )
}
