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

function wrapText(text, maxChars = 22) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? current + " " + word : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function ValuesXTick({ x, y, payload }) {
  const lines = wrapText(payload.value, 22);
  return (
    <text x={x} y={y + 14} textAnchor="middle" fill="var(--g-800)" fontSize={10}>
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 11}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export default function Values({ data, view, t }) {
  const rows = data.valSummary || [];

  const chartData = rows.map((r) => ({
    label: r.full,
    Self: r.selfScore || 0,
    "Peer avg": r.peerAvg || 0,
    Manager: r.managerScore || 0,
  }));

  const maxLines = chartData.reduce(
    (acc, row) => Math.max(acc, wrapText(row.label, 22).length),
    1
  );
  const bottomPad = 24 + maxLines * 12;
  const chartHeight = 280 + bottomPad;

  return (
    <div>
      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>{t("values.title")}</div>
        <div style={{ width: "100%", height: chartHeight }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: bottomPad, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--g-200)" />
              <XAxis
                dataKey="label"
                interval={0}
                tick={<ValuesXTick />}
                axisLine={false}
                tickLine={false}
                height={bottomPad}
              />
              <YAxis
                domain={[0, 5]}
                ticks={[0, 1, 2, 3, 4, 5]}
                tick={{ fill: "var(--g-500)", fontSize: 11 }}
              />
              <Tooltip />
              <Legend verticalAlign="top" height={28} />
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
            <div className="section-h" style={{ marginTop: 0 }}>{r.full}</div>
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
