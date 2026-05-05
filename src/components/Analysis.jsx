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

export default function Analysis({ data }) {
  const rows = data.compSummary || [];

  const radarData = rows.map((r) => ({
    label: r.label,
    Self: r.selfScore || 0,
    "Peer avg": r.peerAvg || 0,
    Manager: r.managerScore || 0,
  }));

  return (
    <div>
      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>Competency radar (1–10)</div>
        <div style={{ width: "100%", height: 340 }}>
          <ResponsiveContainer>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="var(--g-300)" />
              <PolarAngleAxis dataKey="label" tick={{ fill: "var(--g-800)", fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "var(--g-500)", fontSize: 11 }} />
              <Radar name="Self" dataKey="Self" stroke="var(--g-800)" fill="var(--g-800)" fillOpacity={0.12} />
              <Radar name="Peer avg" dataKey="Peer avg" stroke="var(--green)" fill="var(--green)" fillOpacity={0.18} />
              <Radar name="Manager" dataKey="Manager" stroke="var(--orange)" fill="var(--orange)" fillOpacity={0.15} />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>Score breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Competency</th>
              <th>Self</th>
              <th>Peer avg</th>
              <th>Manager</th>
              <th>Gaps</th>
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

      {rows.map((r) =>
        r.reviews?.some((rev) => rev.comment) ? (
          <div key={r.key} className="card">
            <div className="section-h" style={{ marginTop: 0 }}>{r.label} — comments</div>
            {r.reviews
              .filter((rev) => rev.comment)
              .map((rev, i) => (
                <blockquote key={i} className="quote" style={{ marginBottom: 8 }}>
                  "{rev.comment}"
                  <div className="muted" style={{ fontSize: 12 }}>
                    — {rev.relation} {rev.score != null ? `(scored ${rev.score})` : ""}
                  </div>
                </blockquote>
              ))}
          </div>
        ) : null
      )}
    </div>
  );
}
