export default function Objectives({ result, loading, error, onRegenerate }) {
  if (loading) {
    return (
      <div className="card">
        <span className="spinner" />Generating FAST objectives…
      </div>
    );
  }
  if (error) {
    return (
      <div className="card">
        <p className="error">{error}</p>
        <button className="btn" onClick={onRegenerate}>Try again</button>
      </div>
    );
  }
  if (!result) return null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button className="btn btn-secondary" onClick={onRegenerate}>Regenerate</button>
      </div>
      {(result.objectives || []).map((o, i) => (
        <div key={i} className="objective" style={{ borderLeftWidth: 4, borderLeftStyle: "solid", borderLeftColor: o.color || "var(--g-300)" }}>
          <div className="pillar" style={{ color: o.color || "var(--g-600)" }}>
            {o.icon} {o.pillar}
          </div>
          <p style={{ fontWeight: 500, margin: "4px 0 8px" }}>{o.statement}</p>
          {o.fastCriteria && <p style={{ margin: "0 0 6px", fontSize: 13 }}><strong>FAST:</strong> {o.fastCriteria}</p>}
          {o.rationale && <p style={{ margin: "0 0 6px", fontSize: 13 }}><strong>Rationale:</strong> {o.rationale}</p>}
          {o.measure && <p style={{ margin: 0, fontSize: 13 }}><strong>Measure:</strong> {o.measure}</p>}
        </div>
      ))}
    </div>
  );
}
