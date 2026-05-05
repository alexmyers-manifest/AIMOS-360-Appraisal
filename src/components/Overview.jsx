function Stat({ label, value, accent, delta }) {
  return (
    <div style={{ minWidth: 110 }}>
      <div className="section-h" style={{ margin: "0 0 4px" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: accent || "var(--g-900)" }}>
        {value ?? "—"}
      </div>
      {delta != null && (
        <div
          style={{
            fontSize: 11,
            marginTop: 2,
            color: delta > 0 ? "var(--green)" : delta < 0 ? "var(--orange)" : "var(--g-500)",
          }}
        >
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "±"} {Math.abs(delta).toFixed(1)}
        </div>
      )}
    </div>
  );
}

function delta(prev, cur) {
  if (prev == null || cur == null) return null;
  const d = Number(cur) - Number(prev);
  return Math.abs(d) < 0.05 ? 0 : d;
}

export default function Overview({ data, prevData, view, t }) {
  const { employee, ratings, dataDate, openFeedback } = data;
  const prevR = prevData?.ratings || {};

  const counts = {
    strengths: openFeedback?.strengths?.length || 0,
    challenges: openFeedback?.challenges?.length || 0,
    advice: openFeedback?.advice?.length || 0,
    additional: openFeedback?.additional?.length || 0,
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="section-h" style={{ marginTop: 0 }}>{t("overview.reviewee")}</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{employee.name}</div>
            <div style={{ color: "var(--g-600)" }}>{employee.jobTitle}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
              {employee.tenure ? <>{t("overview.tenure")}: <strong>{employee.tenure}</strong> · </> : null}
              {employee.reportsTo ? <>{t("overview.reportsTo")}: <strong>{employee.reportsTo}</strong></> : null}
            </div>
            {dataDate && (
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {t("overview.dataDate")} {dataDate}
              </div>
            )}
          </div>
        </div>
      </div>

      {view === "lm" ? (
        <div className="card">
          <div className="section-h" style={{ marginTop: 0 }}>{t("overview.headline")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginTop: 8 }}>
            <Stat
              label={t("overview.overall")}
              value={ratings.overall}
              accent="var(--blue)"
              delta={prevData ? delta(prevR.overall, ratings.overall) : null}
            />
            <Stat
              label={t("overview.peerAvg")}
              value={ratings.peerAvg}
              accent="var(--green)"
              delta={prevData ? delta(prevR.peerAvg, ratings.peerAvg) : null}
            />
            <Stat
              label={t("overview.self")}
              value={ratings.self}
              accent="var(--g-800)"
              delta={prevData ? delta(prevR.self, ratings.self) : null}
            />
            <Stat
              label={t("overview.manager")}
              value={ratings.manager}
              accent="var(--orange)"
              delta={prevData ? delta(prevR.manager, ratings.manager) : null}
            />
            <Stat label={t("overview.peerCount")} value={ratings.peerCount} />
          </div>
          {prevData && (
            <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
              {t("overview.priorDelta")} ({prevData.dataDate || "—"})
            </p>
          )}
        </div>
      ) : (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>{t("overview.scoresHidden")}</p>
        </div>
      )}

      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>{t("overview.feedback")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginTop: 8 }}>
          <Stat label={t("overview.strengths")} value={counts.strengths} />
          <Stat label={t("overview.challenges")} value={counts.challenges} />
          <Stat label={t("overview.advice")} value={counts.advice} />
          <Stat label={t("overview.additional")} value={counts.additional} />
        </div>
      </div>
    </div>
  );
}
