import type { RelationshipEdge } from '../../types/game'

interface RelationshipMapProps {
  tables: string[]
  edges: RelationshipEdge[]
  selectedEdges: string[]
  onToggleEdge: (edgeId: string) => void
}

export function RelationshipMap({
  tables,
  edges,
  selectedEdges,
  onToggleEdge,
}: RelationshipMapProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">3. Relationship Map</span>
          <h2>Join Planning</h2>
        </div>
      </div>

      <div className="relationship-nodes">
        {tables.map((table) => (
          <div key={table} className="node-card">
            <strong>{table}</strong>
          </div>
        ))}
      </div>

      <div className="relationship-links">
        {edges.map((edge) => {
          const selected = selectedEdges.includes(edge.id)

          return (
            <button
              key={edge.id}
              className={`relationship-link ${selected ? 'relationship-link-active' : ''}`}
              onClick={() => onToggleEdge(edge.id)}
              type="button"
            >
              <span>{edge.from}</span>
              <strong>{edge.key}</strong>
              <span>{edge.to}</span>
            </button>
          )
        })}
      </div>

      <p className="subtle-copy">
        The map helps you reason about connections, but the mission is graded on your answers and Python output.
      </p>
    </section>
  )
}
