function Delta({ from, to }) {
  if (from == null || to == null) return <span className="muted">—</span>;
  const d = Number(to) - Number(from);
  if (Math.abs(d) < 0.05) return <span className="muted">±0</span>;
  const up = d > 0;
  return (
    <span style={{ color: up ? "var(--green)" : "var(--orange)", fontWeight: 600 }}>
      {up ? "▲" : "▼"} {Math.abs(d).toFixed(1)}
    </span>
  );
}

export default function Compare({ data, prevData, t }) {
  if (!prevData) {
    return (
      <div className="card">
        <p className="muted" style={{ margin: 0 }}>{t("compare.empty")}</p>
      </div>
    );
  }

  const findPrev = (list, key) => (list || []).find((x) => x.key === key);

  return (
    <div>
      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>{t("compare.ratings")}</div>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>{t("compare.previous")}</th>
              <th>{t("compare.current")}</th>
              <th>{t("compare.change")}</th>
            </tr>
          </thead>
          <tbody>
            {[
              { k: "overall", label: t("overview.overall") },
              { k: "peerAvg", label: t("overview.peerAvg") },
              { k: "self", label: t("overview.self") },
              { k: "manager", label: t("overview.manager") },
            ].map((row) => (
              <tr key={row.k}>
                <td><strong>{row.label}</strong></td>
                <td>{prevData.ratings?.[row.k] ?? "—"}</td>
                <td>{data.ratings?.[row.k] ?? "—"}</td>
                <td><Delta from={prevData.ratings?.[row.k]} to={data.ratings?.[row.k]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>{t("compare.competencies")}</div>
        <table>
          <thead>
            <tr>
              <th>{t("analysis.competency")}</th>
              <th>{t("compare.previous")} {t("overview.peerAvg")}</th>
              <th>{t("compare.current")} {t("overview.peerAvg")}</th>
              <th>{t("compare.change")}</th>
            </tr>
          </thead>
          <tbody>
            {(data.compSummary || []).map((c) => {
              const p = findPrev(prevData.compSummary, c.key);
              return (
                <tr key={c.key}>
                  <td><strong>{c.label}</strong></td>
                  <td>{p?.peerAvg ?? "—"}</td>
                  <td>{c.peerAvg ?? "—"}</td>
                  <td><Delta from={p?.peerAvg} to={c.peerAvg} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>{t("compare.values")}</div>
        <table>
          <thead>
            <tr>
              <th>Value</th>
              <th>{t("compare.previous")} {t("overview.peerAvg")}</th>
              <th>{t("compare.current")} {t("overview.peerAvg")}</th>
              <th>{t("compare.change")}</th>
            </tr>
          </thead>
          <tbody>
            {(data.valSummary || []).map((v) => {
              const p = findPrev(prevData.valSummary, v.key);
              return (
                <tr key={v.key}>
                  <td><strong>{v.short}</strong></td>
                  <td>{p?.peerAvg ?? "—"}</td>
                  <td>{v.peerAvg ?? "—"}</td>
                  <td><Delta from={p?.peerAvg} to={v.peerAvg} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
