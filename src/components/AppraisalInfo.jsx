function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="val">{value ?? "—"}</div>
    </div>
  );
}

function fmt(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function AppraisalInfo({ data, savedAt, lastEditAt, conductedBy, t }) {
  const counts = {
    strengths: data.openFeedback?.strengths?.length || 0,
    challenges: data.openFeedback?.challenges?.length || 0,
    advice: data.openFeedback?.advice?.length || 0,
    additional: data.openFeedback?.additional?.length || 0,
  };

  return (
    <div>
      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>{t("info.feedback")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          <Stat label={t("info.strengths")} value={counts.strengths} />
          <Stat label={t("info.challenges")} value={counts.challenges} />
          <Stat label={t("info.advice")} value={counts.advice} />
          <Stat label={t("info.additional")} value={counts.additional} />
        </div>
      </div>

      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>{t("info.timestamps")}</div>
        <table>
          <tbody>
            <tr>
              <td><strong>{t("info.dataDate")}</strong></td>
              <td>{data.dataDate || "—"}</td>
            </tr>
            <tr>
              <td><strong>{t("info.savedAt")}</strong></td>
              <td>{fmt(savedAt)}</td>
            </tr>
            <tr>
              <td><strong>{t("info.lastEdit")}</strong></td>
              <td>{fmt(lastEditAt)}</td>
            </tr>
            {conductedBy && (
              <tr>
                <td><strong>{t("info.reviewer")}</strong></td>
                <td>{conductedBy}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
