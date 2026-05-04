export default function Synthesis({ result, loading, error, onRegenerate }) {
  if (loading) {
    return (
      <div className="card">
        <span className="spinner" />Generating synthesis…
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
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <p style={{ marginTop: 0 }}>{result.summary}</p>
          <button className="btn btn-secondary" onClick={onRegenerate}>Regenerate</button>
        </div>
        {result.highlightQuote?.text && (
          <blockquote className="quote">
            "{result.highlightQuote.text}"
            <div className="muted" style={{ fontSize: 12 }}>— {result.highlightQuote.attribution}</div>
          </blockquote>
        )}
      </div>

      {result.strengths?.length > 0 && (
        <div className="card">
          <div className="section-h">Strengths</div>
          {result.strengths.map((s, i) => (
            <div key={i} className="theme">
              <div className="theme-title">{s.title}</div>
              <p style={{ margin: "0 0 8px" }}>{s.body}</p>
              {s.quote && (
                <blockquote className="quote">
                  "{s.quote}"
                  {s.quoteAttr && <div className="muted" style={{ fontSize: 12 }}>— {s.quoteAttr}</div>}
                </blockquote>
              )}
            </div>
          ))}
        </div>
      )}

      {result.development?.length > 0 && (
        <div className="card">
          <div className="section-h">Development themes</div>
          {result.development.map((d, i) => (
            <div key={i} className="theme" style={{ borderLeftColor: "var(--orange)" }}>
              <div className="theme-title">{d.title}</div>
              <p style={{ margin: "0 0 6px" }}>{d.body}</p>
              {d.selfAwareness && <p className="muted" style={{ margin: "0 0 6px", fontSize: 13 }}><strong>Self-awareness:</strong> {d.selfAwareness}</p>}
              {d.recommendation && <p style={{ margin: 0, fontSize: 13 }}><strong>Recommendation:</strong> {d.recommendation}</p>}
            </div>
          ))}
        </div>
      )}

      {result.agreedPriority && (
        <div className="card">
          <div className="section-h">Agreed priority</div>
          <p style={{ margin: 0 }}>{result.agreedPriority}</p>
        </div>
      )}
    </div>
  );
}
