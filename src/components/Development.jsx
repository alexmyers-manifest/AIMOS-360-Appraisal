export default function Development({ result, loading, error, onRegenerate }) {
  if (loading) {
    return (
      <div className="card">
        <span className="spinner" />Generating L&D plan…
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
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="section-h" style={{ marginTop: 0 }}>Coaching focus</div>
          <p style={{ margin: 0 }}>{result.coachingFocus}</p>
        </div>
        <button className="btn btn-secondary" onClick={onRegenerate}>Regenerate</button>
      </div>

      {result.opportunities?.length > 0 && (
        <div className="card">
          <div className="section-h">Opportunities</div>
          {result.opportunities.map((o, i) => (
            <div key={i} className="theme" style={{ borderLeftColor: o.color || "var(--blue)" }}>
              <div className="theme-title">{o.type} — {o.gap}</div>
              <p style={{ margin: 0 }}>{o.description}</p>
            </div>
          ))}
        </div>
      )}

      {result.books?.length > 0 && (
        <div className="card">
          <div className="section-h">Suggested reading</div>
          {result.books.map((b, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div className="theme-title">
                {b.amazonUrl ? (
                  <a href={b.amazonUrl} target="_blank" rel="noreferrer">{b.title}</a>
                ) : (
                  b.title
                )}
                <span className="muted"> — {b.author}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13 }}>{b.rationale}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
