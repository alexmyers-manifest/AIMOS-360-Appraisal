function delta(prev, cur) {
  if (prev == null || cur == null) return null;
  const d = Number(cur) - Number(prev);
  return Math.abs(d) < 0.05 ? 0 : d;
}

function Stat({ label, value, accent, deltaVal }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="val" style={{ color: accent || "var(--g-900)" }}>
        {value ?? "—"}
      </div>
      {deltaVal != null && (
        <div
          className="delta"
          style={{
            color: deltaVal > 0 ? "var(--green)" : deltaVal < 0 ? "var(--orange)" : "var(--g-500)",
          }}
        >
          {deltaVal > 0 ? "▲" : deltaVal < 0 ? "▼" : "±"} {Math.abs(deltaVal).toFixed(1)}
        </div>
      )}
    </div>
  );
}

export default function TitleModule({ data, prevData, view, t, onUploadDifferent }) {
  const { employee, ratings, dataDate } = data;
  const prevR = prevData?.ratings || {};
  const showRatings = view === "lm";

  return (
    <div className="title-module">
      <div>
        <h2>{employee.name}</h2>
        <div className="role">{employee.jobTitle}</div>
        <div className="meta">
          {employee.tenure && (
            <span>
              {t("title.tenure")}: <strong>{employee.tenure}</strong>
            </span>
          )}
          {employee.reportsTo && (
            <span>
              {t("title.reportsTo")}: <strong>{employee.reportsTo}</strong>
            </span>
          )}
          {dataDate && (
            <span>
              {t("title.dataDate")}: <strong>{dataDate}</strong>
            </span>
          )}
          {prevData && (
            <span style={{ color: "var(--blue)" }}>
              {t("overview.priorDelta")} <strong>{prevData.dataDate || "—"}</strong>
            </span>
          )}
        </div>
      </div>

      {showRatings ? (
        <div className="ratings">
          <Stat
            label={t("overview.overall")}
            value={ratings.overall}
            accent="var(--blue)"
            deltaVal={prevData ? delta(prevR.overall, ratings.overall) : null}
          />
          <Stat
            label={t("overview.peerAvg")}
            value={ratings.peerAvg}
            accent="var(--green)"
            deltaVal={prevData ? delta(prevR.peerAvg, ratings.peerAvg) : null}
          />
          <Stat
            label={t("overview.self")}
            value={ratings.self}
            deltaVal={prevData ? delta(prevR.self, ratings.self) : null}
          />
          <Stat
            label={t("overview.manager")}
            value={ratings.manager}
            accent="var(--orange)"
            deltaVal={prevData ? delta(prevR.manager, ratings.manager) : null}
          />
          <Stat label={t("overview.peerCount")} value={ratings.peerCount} />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <button className="pill-btn" onClick={onUploadDifferent}>
            Upload different file
          </button>
        </div>
      )}

      {showRatings && (
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button className="pill-btn" onClick={onUploadDifferent}>
            Upload different file
          </button>
        </div>
      )}
    </div>
  );
}
