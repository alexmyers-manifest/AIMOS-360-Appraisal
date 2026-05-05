import EditableText from "./EditableText.jsx";

function delta(prev, cur) {
  if (prev == null || cur == null) return null;
  const d = Number(cur) - Number(prev);
  return Math.abs(d) < 0.05 ? 0 : d;
}

// Returns "high" if this score is >2 above the average of the others,
// "low" if >2 below, otherwise null.
function scoreAccent(value, others) {
  if (value == null) return null;
  const peers = others.filter((v) => v != null && !Number.isNaN(Number(v)));
  if (peers.length === 0) return null;
  const avg = peers.reduce((a, b) => a + Number(b), 0) / peers.length;
  const diff = Number(value) - avg;
  if (diff > 2) return "high";
  if (diff < -2) return "low";
  return null;
}

function colourFor(accent) {
  if (accent === "high") return "var(--green)";
  if (accent === "low") return "var(--orange)";
  return "var(--blue)";
}

function Stat({ label, value, accent, deltaVal }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="val" style={{ color: colourFor(accent) }}>
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

export default function TitleModule({
  data,
  prevData,
  view,
  t,
  onUploadDifferent,
  displayName,
  onUpdateDisplayName,
}) {
  const { employee, ratings, dataDate } = data;
  const prevR = prevData?.ratings || {};
  const isLm = view === "lm";

  // Compare the four core scores against each other for the colour rule.
  const scoreSet = {
    peerAvg: ratings.peerAvg,
    self: ratings.self,
    manager: ratings.manager,
    overall: ratings.overall,
  };
  const others = (key) =>
    Object.entries(scoreSet)
      .filter(([k]) => k !== key)
      .map(([, v]) => v);

  const accents = {
    peerAvg: scoreAccent(scoreSet.peerAvg, others("peerAvg")),
    self: scoreAccent(scoreSet.self, others("self")),
    manager: scoreAccent(scoreSet.manager, others("manager")),
    overall: scoreAccent(scoreSet.overall, others("overall")),
  };

  const name = displayName || employee.name;

  return (
    <div className="title-module">
      <div>
        <h2>
          {isLm ? (
            <EditableText
              value={name}
              onSave={onUpdateDisplayName}
              placeholder={employee.name}
              style={{ fontWeight: 600, fontSize: 24, letterSpacing: "-0.02em" }}
            />
          ) : (
            name
          )}
        </h2>
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

      <div className="ratings">
        <Stat
          label={t("overview.peerAvg")}
          value={ratings.peerAvg}
          accent={accents.peerAvg}
          deltaVal={prevData ? delta(prevR.peerAvg, ratings.peerAvg) : null}
        />
        <Stat
          label={t("overview.self")}
          value={ratings.self}
          accent={accents.self}
          deltaVal={prevData ? delta(prevR.self, ratings.self) : null}
        />
        <Stat
          label={t("overview.manager")}
          value={ratings.manager}
          accent={accents.manager}
          deltaVal={prevData ? delta(prevR.manager, ratings.manager) : null}
        />
        <Stat label={t("overview.peerCount")} value={ratings.peerCount} />
        <Stat
          label={t("overview.overall")}
          value={ratings.overall}
          accent={accents.overall}
          deltaVal={prevData ? delta(prevR.overall, ratings.overall) : null}
        />
      </div>

      <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
        <button className="pill-btn" onClick={onUploadDifferent}>
          Upload different file
        </button>
      </div>
    </div>
  );
}
