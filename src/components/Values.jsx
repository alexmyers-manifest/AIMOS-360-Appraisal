import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Values({ data, view, t }) {
  const rows = data.valSummary || [];

  const chartData = rows.map((r) => ({
    label: r.short,
    Self: r.selfScore || 0,
    "Peer avg": r.peerAvg || 0,
    Manager: r.managerScore || 0,
  }));

  return (
    <div>
      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>{t("values.title")}</div>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--g-200)" />
              <XAxis dataKey="label" tick={{ fill: "var(--g-800)", fontSize: 12 }} />
              <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: "var(--g-500)", fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Self" fill="var(--g-800)" />
              <Bar dataKey="Peer avg" fill="var(--green)" />
              <Bar dataKey="Manager" fill="var(--orange)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {view === "lm" &&
        rows.map((r) => (
          <div key={r.key} className="card">
            <div className="section-h" style={{ marginTop: 0 }}>{r.short}</div>
            <p className="muted" style={{ fontStyle: "italic", marginTop: 0 }}>"{r.full}"</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
              <div>
                <div className="section-h">{t("overview.self")}</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{r.selfScore ?? "—"}</div>
                {r.selfLabel && <div className="muted" style={{ fontSize: 12 }}>{r.selfLabel}</div>}
              </div>
              <div>
                <div className="section-h">{t("overview.peerAvg")}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--green)" }}>{r.peerAvg ?? "—"}</div>
              </div>
              <div>
                <div className="section-h">{t("overview.manager")}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--orange)" }}>{r.managerScore ?? "—"}</div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
