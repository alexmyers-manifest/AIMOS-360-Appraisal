import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

export default function Analysis({ data, prevData, view, t }) {
  const rows = data.compSummary || [];

  const radarData = rows.map((r) => {
    const item = {
      label: r.label,
      Self: r.selfScore || 0,
      "Peer avg": r.peerAvg || 0,
      Manager: r.managerScore || 0,
    };
    if (prevData) {
      const p = (prevData.compSummary || []).find((x) => x.key === r.key);
      if (p) item.Previous = p.peerAvg || 0;
    }
    return item;
  });

  const showPrevSeries = prevData && radarData.some((d) => "Previous" in d);

  return (
    <div>
      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>{t("analysis.title")}</div>
        <div style={{ width: "100%", height: 340 }}>
          <ResponsiveContainer>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="var(--g-300)" />
              <PolarAngleAxis dataKey="label" tick={{ fill: "var(--g-800)", fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "var(--g-500)", fontSize: 11 }} />
              <Radar name="Self" dataKey="Self" stroke="var(--g-800)" fill="var(--g-800)" fillOpacity={0.12} />
              <Radar name="Peer avg" dataKey="Peer avg" stroke="var(--green)" fill="var(--green)" fillOpacity={0.18} />
              <Radar name="Manager" dataKey="Manager" stroke="var(--orange)" fill="var(--orange)" fillOpacity={0.15} />
              {showPrevSeries && (
                <Radar
                  name="Previous"
                  dataKey="Previous"
                  stroke="var(--g-400)"
                  fill="none"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
              )}
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {view === "lm" && (
        <div className="card">
          <div className="section-h" style={{ marginTop: 0 }}>{t("analysis.breakdown")}</div>
          <table>
            <thead>
              <tr>
                <th>{t("analysis.competency")}</th>
                <th>{t("overview.self")}</th>
                <th>{t("overview.peerAvg")}</th>
                <th>{t("overview.manager")}</th>
                <th>{t("analysis.gaps")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td><strong>{r.label}</strong></td>
                  <td>{r.selfScore ?? "—"}</td>
                  <td>{r.peerAvg ?? "—"}</td>
                  <td>{r.managerScore ?? "—"}</td>
                  <td style={{ color: r.gaps?.length ? "var(--orange)" : "var(--g-400)" }}>
                    {r.gaps?.length ? r.gaps.join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "lm" &&
        rows.map((r) =>
          r.reviews?.some((rev) => rev.comment) ? (
            <div key={r.key} className="card">
              <div className="section-h" style={{ marginTop: 0 }}>{r.label} — {t("analysis.comments")}</div>
              {r.reviews
                .filter((rev) => rev.comment)
                .map((rev, i) => (
                  <blockquote key={i} className="quote" style={{ marginBottom: 8 }}>
                    "{rev.comment}"
                    <div className="muted" style={{ fontSize: 12 }}>
                      — {rev.relation} {rev.score != null ? `(${rev.score})` : ""}
                    </div>
                  </blockquote>
                ))}
            </div>
          ) : null
        )}
    </div>
  );
}
