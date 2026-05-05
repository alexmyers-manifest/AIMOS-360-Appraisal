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
import EditableText from "./EditableText.jsx";

function splitLabel(label) {
  if (label.length <= 14) return [label];
  if (label.includes(" & ")) {
    const [a, b] = label.split(" & ");
    return [a + " &", b];
  }
  const words = label.split(" ");
  if (words.length === 1) return [label];
  const half = Math.ceil(words.length / 2);
  return [words.slice(0, half).join(" "), words.slice(half).join(" ")];
}

function RadarTick({ x, y, payload, textAnchor }) {
  const lines = splitLabel(String(payload.value));
  const dy = lines.length > 1 ? -6 : 0;
  return (
    <text x={x} y={y + dy} textAnchor={textAnchor} fill="var(--g-800)" fontSize={11}>
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 14}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export default function Overview({
  data,
  prevData,
  view,
  t,
  overviewStatement,
  onUpdateOverview,
  synthesisSummary,
}) {
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

  const editableValue = overviewStatement || synthesisSummary || "";
  const readOnly = view !== "lm";

  return (
    <div>
      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>{t("overview.statement")}</div>
        {!readOnly && (
          <p className="muted" style={{ fontSize: 12, marginTop: 0, marginBottom: 8 }}>
            {t("overview.statementHelp")}
          </p>
        )}
        <div style={{ fontSize: 15, lineHeight: 1.6 }}>
          <EditableText
            value={editableValue}
            multiline
            rows={3}
            readOnly={readOnly}
            onSave={onUpdateOverview}
            placeholder={readOnly ? "—" : t("overview.statementHelp")}
          />
        </div>
      </div>

      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>{t("analysis.title")}</div>
        <div style={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <RadarChart data={radarData} outerRadius="68%" margin={{ top: 8, right: 30, bottom: 16, left: 30 }}>
              <PolarGrid stroke="var(--g-300)" />
              <PolarAngleAxis dataKey="label" tick={<RadarTick />} />
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
              <div className="section-h" style={{ marginTop: 0 }}>
                {r.label} — {t("analysis.comments")}
              </div>
              {r.reviews
                .filter((rev) => rev.comment)
                .map((rev, i) => (
                  <blockquote key={i} className="quote" style={{ marginBottom: 8 }}>
                    "{rev.comment}"
                    <div className="muted" style={{ fontSize: 12 }}>
                      — {rev.reviewer}
                      {rev.relation ? ` · ${rev.relation}` : ""}
                      {rev.score != null ? ` · scored ${rev.score}` : ""}
                    </div>
                  </blockquote>
                ))}
            </div>
          ) : null
        )}
    </div>
  );
}
