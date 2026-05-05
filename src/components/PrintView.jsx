import Overview from "./Overview.jsx";
import Analysis from "./Analysis.jsx";
import Values from "./Values.jsx";
import Synthesis from "./Synthesis.jsx";
import Objectives from "./Objectives.jsx";
import Development from "./Development.jsx";
import Compare from "./Compare.jsx";

const noop = () => {};

export default function PrintView({ data, prevData, results, view, t }) {
  if (!data) return null;
  return (
    <div className="print-only">
      <div className="print-header">
        <h1 style={{ margin: 0, fontSize: 22 }}>AIMOS 360º Review — {data.employee?.name}</h1>
        <div className="muted" style={{ fontSize: 12 }}>{data.employee?.jobTitle}</div>
        {data.dataDate && (
          <div className="muted" style={{ fontSize: 11 }}>{t("overview.dataDate")} {data.dataDate}</div>
        )}
      </div>

      <h2 className="page-break-before">{t("tab.overview")}</h2>
      <Overview data={data} prevData={prevData} view={view} t={t} />

      <h2 className="page-break-before">{t("tab.analysis")}</h2>
      <Analysis data={data} prevData={prevData} view={view} t={t} />

      <h2 className="page-break-before">{t("tab.values")}</h2>
      <Values data={data} view={view} t={t} />

      <h2 className="page-break-before">{t("tab.synthesis")}</h2>
      <Synthesis result={results.synthesis} view="normal" t={t} onRegenerate={noop} />

      <h2 className="page-break-before">{t("tab.objectives")}</h2>
      <Objectives result={results.objectives} view="normal" t={t} onRegenerate={noop} onUpdate={noop} />

      <h2 className="page-break-before">{t("tab.development")}</h2>
      <Development
        result={results.development}
        view="normal"
        t={t}
        onRegenerate={noop}
        onUpdateRoot={noop}
        onUpdateOpportunity={noop}
        onUpdateBook={noop}
      />

      {prevData && (
        <>
          <h2 className="page-break-before">{t("tab.compare")}</h2>
          <Compare data={data} prevData={prevData} t={t} />
        </>
      )}

      <div className="print-footer muted" style={{ marginTop: 24, fontSize: 10 }}>
        {t("footer.confidential")}
      </div>
    </div>
  );
}
