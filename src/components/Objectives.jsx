import EditableText from "./EditableText.jsx";

export default function Objectives({ result, loading, error, onRegenerate, onUpdate, view, t }) {
  if (loading) {
    return (
      <div className="card">
        <span className="spinner" />{t("objectives.generating")}
      </div>
    );
  }
  if (error) {
    return (
      <div className="card">
        <p className="error">{error}</p>
        <button className="pill-btn" onClick={onRegenerate}>{t("edit.tryAgain")}</button>
      </div>
    );
  }
  if (!result) return null;

  const readOnly = view !== "lm";
  const objectives = result.objectives || [];

  return (
    <div>
      {view === "lm" && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button className="pill-btn" onClick={onRegenerate}>{t("objectives.regenerate")}</button>
        </div>
      )}
      <div className="objectives-grid">
        {objectives.map((o, i) => (
          <div
            key={i}
            className="objective"
            style={{ borderLeftWidth: 4, borderLeftStyle: "solid", borderLeftColor: o.color || "var(--g-300)" }}
          >
            <div className="pillar" style={{ color: o.color || "var(--g-600)" }}>
              {o.icon} {o.pillar}
            </div>
            <div style={{ fontWeight: 500, margin: "6px 0 12px", fontSize: 15 }}>
              <EditableText
                value={o.statement}
                multiline
                rows={2}
                readOnly={readOnly}
                onSave={(v) => onUpdate(i, { statement: v })}
              />
            </div>
            <p style={{ margin: "0 0 8px", fontSize: 13 }}>
              <strong>{t("objectives.fast")}:</strong>{" "}
              <EditableText
                value={o.fastCriteria}
                multiline
                rows={2}
                readOnly={readOnly}
                onSave={(v) => onUpdate(i, { fastCriteria: v })}
              />
            </p>
            <p style={{ margin: "0 0 8px", fontSize: 13 }}>
              <strong>{t("objectives.rationale")}:</strong>{" "}
              <EditableText
                value={o.rationale}
                multiline
                rows={2}
                readOnly={readOnly}
                onSave={(v) => onUpdate(i, { rationale: v })}
              />
            </p>
            <p style={{ margin: 0, fontSize: 13 }}>
              <strong>{t("objectives.measure")}:</strong>{" "}
              <EditableText
                value={o.measure}
                multiline
                rows={2}
                readOnly={readOnly}
                onSave={(v) => onUpdate(i, { measure: v })}
              />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
