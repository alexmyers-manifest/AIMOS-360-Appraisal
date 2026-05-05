export default function AppraisalHistory({ history, onLoad, onDelete, t }) {
  if (!history || history.length === 0) return null;

  const grouped = {};
  for (const h of history) {
    const yr = h.savedAt ? new Date(h.savedAt).getFullYear() : "—";
    (grouped[yr] = grouped[yr] || []).push(h);
  }
  const years = Object.keys(grouped).sort((a, b) => b - a);

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div className="section-h" style={{ marginTop: 0 }}>{t("history.title")}</div>
      <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>{t("history.sub")}</div>
      {years.map((yr) => (
        <div key={yr} style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--g-400)",
              marginBottom: 6,
              paddingLeft: 2,
            }}
          >
            {yr}
          </div>
          {grouped[yr].map((h) => {
            const hasAI = h.synthesis || h.objectives || h.development;
            return (
              <div
                key={h.hk}
                onClick={() => onLoad(h)}
                className="history-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  border: "1px solid var(--g-200)",
                  borderRadius: 6,
                  marginBottom: 4,
                  cursor: "pointer",
                  background: "#fff",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{h.employeeName}</div>
                  <div style={{ fontSize: 12, color: "var(--g-600)" }}>
                    {h.jobTitle}
                    {h.dataDate ? " · " + h.dataDate : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {hasAI && (
                    <span className="pill pill-admin" style={{ marginRight: 4 }}>
                      {t("history.aiBadge")}
                    </span>
                  )}
                  <div style={{ fontSize: 11, color: "var(--g-400)", marginTop: 2 }}>
                    {t("history.saved")} {formatDate(h.savedAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(h.hk);
                  }}
                  title={t("history.delete")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--g-400)",
                    fontSize: 18,
                    padding: "2px 6px",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
