import EditableText from "./EditableText.jsx";

export default function Development({
  result,
  loading,
  error,
  onRegenerate,
  onUpdateRoot,
  onUpdateOpportunity,
  onUpdateBook,
  view,
  t,
}) {
  if (loading) {
    return (
      <div className="card">
        <span className="spinner" />{t("development.generating")}
      </div>
    );
  }
  if (error) {
    return (
      <div className="card">
        <p className="error">{error}</p>
        <button className="btn" onClick={onRegenerate}>{t("edit.tryAgain")}</button>
      </div>
    );
  }
  if (!result) return null;

  const readOnly = view !== "lm";

  return (
    <div>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div className="section-h" style={{ marginTop: 0 }}>{t("development.coachingFocus")}</div>
          <EditableText
            value={result.coachingFocus}
            multiline
            rows={2}
            readOnly={readOnly}
            onSave={(v) => onUpdateRoot({ coachingFocus: v })}
          />
        </div>
        {view === "lm" && (
          <button className="btn btn-secondary" onClick={onRegenerate}>{t("development.regenerate")}</button>
        )}
      </div>

      {result.opportunities?.length > 0 && (
        <div className="card">
          <div className="section-h" style={{ marginTop: 0 }}>{t("development.opportunities")}</div>
          {result.opportunities.map((o, i) => (
            <div key={i} className="theme" style={{ borderLeftColor: o.color || "var(--blue)" }}>
              <div className="theme-title">
                <EditableText
                  value={o.type}
                  readOnly={readOnly}
                  onSave={(v) => onUpdateOpportunity(i, { type: v })}
                />{" "}
                —{" "}
                <EditableText
                  value={o.gap}
                  readOnly={readOnly}
                  onSave={(v) => onUpdateOpportunity(i, { gap: v })}
                />
              </div>
              <p style={{ margin: 0 }}>
                <EditableText
                  value={o.description}
                  multiline
                  rows={2}
                  readOnly={readOnly}
                  onSave={(v) => onUpdateOpportunity(i, { description: v })}
                />
              </p>
            </div>
          ))}
        </div>
      )}

      {result.books?.length > 0 && (
        <div className="card">
          <div className="section-h" style={{ marginTop: 0 }}>{t("development.reading")}</div>
          {result.books.map((b, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div className="theme-title">
                {b.amazonUrl && readOnly ? (
                  <a href={b.amazonUrl} target="_blank" rel="noreferrer">{b.title}</a>
                ) : (
                  <EditableText
                    value={b.title}
                    readOnly={readOnly}
                    onSave={(v) => onUpdateBook(i, { title: v })}
                  />
                )}
                <span className="muted"> — </span>
                <span className="muted">
                  <EditableText
                    value={b.author}
                    readOnly={readOnly}
                    onSave={(v) => onUpdateBook(i, { author: v })}
                  />
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13 }}>
                <EditableText
                  value={b.rationale}
                  multiline
                  rows={2}
                  readOnly={readOnly}
                  onSave={(v) => onUpdateBook(i, { rationale: v })}
                />
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
