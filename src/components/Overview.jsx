function Stat({ label, value, accent }) {
  return (
    <div style={{ minWidth: 110 }}>
      <div className="section-h" style={{ margin: "0 0 4px" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: accent || "var(--g-900)" }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

export default function Overview({ data }) {
  const { employee, ratings, dataDate, openFeedback } = data;

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
            <div className="section-h" style={{ marginTop: 0 }}>Reviewee</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{employee.name}</div>
            <div style={{ color: "var(--g-600)" }}>{employee.jobTitle}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
              {employee.tenure ? <>Tenure: <strong>{employee.tenure}</strong> · </> : null}
              {employee.reportsTo ? <>Reports to: <strong>{employee.reportsTo}</strong></> : null}
            </div>
            {dataDate && (
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Data submitted {dataDate}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>Headline ratings</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginTop: 8 }}>
          <Stat label="Overall" value={ratings.overall} accent="var(--blue)" />
          <Stat label="Peer avg" value={ratings.peerAvg} accent="var(--green)" />
          <Stat label="Self" value={ratings.self} accent="var(--g-800)" />
          <Stat label="Manager" value={ratings.manager} accent="var(--orange)" />
          <Stat label="Peer count" value={ratings.peerCount} />
        </div>
      </div>

      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>Open feedback received</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginTop: 8 }}>
          <Stat label="Strengths" value={counts.strengths} />
          <Stat label="Challenges" value={counts.challenges} />
          <Stat label="Advice" value={counts.advice} />
          <Stat label="Additional context" value={counts.additional} />
        </div>
        <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
          Synthesis tab translates these into themes — head there to see Claude's read.
        </p>
      </div>
    </div>
  );
}
