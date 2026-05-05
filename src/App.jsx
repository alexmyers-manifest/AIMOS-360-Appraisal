import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./lib/api.js";
import { getStoredToken, setStoredToken, tokenIsFresh, disableAutoSelect } from "./lib/auth.js";
import { LANGUAGES, getLang, setLang as persistLang, makeT } from "./lib/i18n.js";
import {
  loadHistory,
  saveToHistory,
  deleteFromHistory,
  loadSession,
  saveSession,
  clearSession,
} from "./lib/storage.js";
import { downloadExport } from "./lib/htmlExport.js";
import { buildWordCloud } from "./lib/wordcloud.js";
import SignIn from "./components/SignIn.jsx";
import Upload from "./components/Upload.jsx";
import TitleModule from "./components/TitleModule.jsx";
import Overview from "./components/Overview.jsx";
import Values from "./components/Values.jsx";
import Synthesis from "./components/Synthesis.jsx";
import Objectives from "./components/Objectives.jsx";
import Development from "./components/Development.jsx";
import Compare from "./components/Compare.jsx";
import AppraisalInfo from "./components/AppraisalInfo.jsx";
import Admin from "./components/Admin.jsx";
import Roundel from "./components/Roundel.jsx";

export default function App() {
  const [me, setMe] = useState(null);
  const [meErr, setMeErr] = useState(null);
  const [view, setViewState] = useState("loading");
  const [route, setRoute] = useState(window.location.hash === "#admin" ? "admin" : "app");

  const [data, setData] = useState(null);
  const [prevData, setPrevData] = useState(null);
  const [tab, setTab] = useState("overview");

  const [results, setResults] = useState({
    synthesis: null,
    objectives: null,
    development: null,
    overviewStatement: "",
    displayName: "",
    savedAt: null,
    lastEditAt: null,
  });
  const [loading, setLoading] = useState({ synthesis: false, objectives: false, development: false });
  const [errors, setErrors] = useState({ synthesis: null, objectives: null, development: null });

  const [lmView, setLmView] = useState(true);
  const [lang, setLang] = useState(getLang());
  const [history, setHistory] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const t = useMemo(() => makeT(lang), [lang]);
  const viewMode = lmView ? "lm" : "normal";

  // Sequence guard so a stale in-flight generation can't overwrite fresh state
  // if the user uploads a different file mid-generation.
  const generationSeq = useRef({ synthesis: 0, objectives: 0, development: 0 });

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash === "#admin" ? "admin" : "app");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const t = getStoredToken();
    if (!t || !tokenIsFresh(t)) {
      setStoredToken(null);
      setViewState("signin");
      return;
    }
    api
      .me()
      .then((m) => {
        setMe(m);
        if (!m.isAllowed) setViewState("notAllowed");
        else setViewState("app");
      })
      .catch((e) => {
        setMeErr(e.message);
        setViewState("signin");
      });
  }, []);

  useEffect(() => {
    if (!me?.email || hydrated) return;
    const session = loadSession(me.email);
    if (session) {
      if (session.data) setData(session.data);
      if (session.prevData) setPrevData(session.prevData);
      if (session.results) setResults(session.results);
      if (session.lmView != null) setLmView(session.lmView);
    }
    setHistory(loadHistory(me.email));
    setHydrated(true);
  }, [me, hydrated]);

  useEffect(() => {
    if (!me?.email || !hydrated) return;
    saveSession(me.email, { data, prevData, results, lmView });
  }, [me, hydrated, data, prevData, results, lmView]);

  useEffect(() => {
    if (!me?.email || !hydrated || !data?.employee) return;
    const next = saveToHistory(me.email, {
      employeeName: data.employee.name,
      jobTitle: data.employee.jobTitle,
      dataDate: data.dataDate,
      data,
      prevData,
      synthesis: results.synthesis,
      objectives: results.objectives,
      development: results.development,
      overviewStatement: results.overviewStatement,
      displayName: results.displayName,
    });
    setHistory(next);
  }, [
    me,
    hydrated,
    data,
    prevData,
    results.synthesis,
    results.objectives,
    results.development,
    results.overviewStatement,
    results.displayName,
  ]);

  function onSignedIn(token) {
    setStoredToken(token);
    setViewState("loading");
    api
      .me()
      .then((m) => {
        setMe(m);
        if (!m.isAllowed) setViewState("notAllowed");
        else setViewState("app");
      })
      .catch((e) => {
        setMeErr(e.message);
        setViewState("signin");
      });
  }

  function signOut() {
    if (me?.email) clearSession(me.email);
    setStoredToken(null);
    setMe(null);
    setData(null);
    setPrevData(null);
    setResults({
      synthesis: null,
      objectives: null,
      development: null,
      overviewStatement: "",
      displayName: "",
      savedAt: null,
      lastEditAt: null,
    });
    setHistory([]);
    setHydrated(false);
    disableAutoSelect();
    setViewState("signin");
  }

  async function runGenerator(type) {
    if (!data) return;
    const seq = ++generationSeq.current[type];
    setLoading((l) => ({ ...l, [type]: true }));
    setErrors((e) => ({ ...e, [type]: null }));

    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      // If a newer call started, drop this one silently.
      if (seq !== generationSeq.current[type]) return;
      try {
        const out = await api.generate(type, data, lang);
        if (seq !== generationSeq.current[type]) return; // stale response
        setResults((r) => ({
          ...r,
          [type]: out,
          savedAt: r.savedAt || new Date().toISOString(),
          lastEditAt: new Date().toISOString(),
        }));
        setLoading((l) => ({ ...l, [type]: false }));
        return;
      } catch (e) {
        lastError = e;
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, attempt * 1500));
        }
      }
    }

    if (seq !== generationSeq.current[type]) return;
    setErrors((er) => ({
      ...er,
      [type]:
        (lastError?.message || "Generation failed") +
        " — retried 3 times. Click Try again or check the function logs.",
    }));
    setLoading((l) => ({ ...l, [type]: false }));
  }

  useEffect(() => {
    if (!data || results.synthesis || loading.synthesis) return;
    runGenerator("synthesis");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (!data || !results.synthesis || results.objectives || loading.objectives) return;
    runGenerator("objectives");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.synthesis]);

  useEffect(() => {
    if (!data || !results.objectives || results.development || loading.development) return;
    runGenerator("development");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.objectives]);

  function changeLang(code) {
    setLang(code);
    persistLang(code);
  }

  function loadFromHistory(h) {
    setData(h.data);
    setPrevData(h.prevData || null);
    setResults({
      synthesis: h.synthesis || null,
      objectives: h.objectives || null,
      development: h.development || null,
      overviewStatement: h.overviewStatement || "",
      displayName: h.displayName || "",
      savedAt: h.savedAt || null,
      lastEditAt: h.savedAt || null,
    });
    setErrors({ synthesis: null, objectives: null, development: null });
    setTab("overview");
  }

  function removeFromHistory(hk) {
    if (!me?.email) return;
    const next = deleteFromHistory(me.email, hk);
    setHistory(next);
  }

  const updateOverviewStatement = (v) =>
    setResults((r) => ({ ...r, overviewStatement: v, lastEditAt: new Date().toISOString() }));

  const updateDisplayName = (v) =>
    setResults((r) => ({ ...r, displayName: v, lastEditAt: new Date().toISOString() }));

  const updateObjective = (i, patch) =>
    setResults((r) => {
      if (!r.objectives) return r;
      const list = (r.objectives.objectives || []).slice();
      list[i] = { ...list[i], ...patch };
      return {
        ...r,
        objectives: { ...r.objectives, objectives: list },
        lastEditAt: new Date().toISOString(),
      };
    });
  const updateDevRoot = (patch) =>
    setResults((r) =>
      r.development
        ? { ...r, development: { ...r.development, ...patch }, lastEditAt: new Date().toISOString() }
        : r
    );
  const updateOpportunity = (i, patch) =>
    setResults((r) => {
      if (!r.development) return r;
      const list = (r.development.opportunities || []).slice();
      list[i] = { ...list[i], ...patch };
      return {
        ...r,
        development: { ...r.development, opportunities: list },
        lastEditAt: new Date().toISOString(),
      };
    });
  const updateBook = (i, patch) =>
    setResults((r) => {
      if (!r.development) return r;
      const list = (r.development.books || []).slice();
      list[i] = { ...list[i], ...patch };
      return {
        ...r,
        development: { ...r.development, books: list },
        lastEditAt: new Date().toISOString(),
      };
    });

  function exportPdf() {
    if (!data) return;
    const displayName = results.displayName || data.employee?.name || "";
    const words = buildWordCloud(data.openFeedback, lang, 40, displayName);
    downloadExport({
      data,
      prevData,
      results,
      words,
      view: viewMode,
      lang,
      t,
      conductedBy: me?.email,
      displayName,
    });
  }

  if (view === "loading") {
    return (
      <div className="shell">
        <p className="muted">
          <span className="spinner" />Loading…
        </p>
      </div>
    );
  }

  if (view === "signin") {
    return <SignIn onSignedIn={onSignedIn} error={meErr} />;
  }

  if (view === "notAllowed") {
    return (
      <div className="shell">
        <div className="card">
          <h2>Access not yet approved</h2>
          <p className="muted">
            You're signed in as <strong>{me?.email}</strong>, but this account isn't on the AIMOS
            allowlist yet. Ask an admin (Alex or Kellie) to add you, then refresh.
          </p>
          <button className="pill-btn" onClick={signOut}>{t("header.signout")}</button>
        </div>
      </div>
    );
  }

  if (route === "admin") {
    if (!me?.isAdmin) {
      return (
        <div className="shell">
          <div className="card">
            <h2>Admin only</h2>
            <p className="muted">You're not an admin. Head back to <a href="#">the app</a>.</p>
          </div>
        </div>
      );
    }
    return <Admin me={me} onSignOut={signOut} />;
  }

  const TABS = [
    { key: "overview", label: t("tab.overview") },
    { key: "values", label: t("tab.values") },
    { key: "synthesis", label: t("tab.synthesis") },
    { key: "objectives", label: t("tab.objectives") },
    { key: "development", label: t("tab.development") },
    ...(prevData ? [{ key: "compare", label: t("tab.compare") }] : []),
    { key: "info", label: t("tab.info") },
  ];

  function uploadDifferent() {
    setData(null);
    setPrevData(null);
    setResults({
      synthesis: null,
      objectives: null,
      development: null,
      overviewStatement: "",
      displayName: "",
      savedAt: null,
      lastEditAt: null,
    });
    setErrors({ synthesis: null, objectives: null, development: null });
  }

  return (
    <div className="shell">
      <header className="header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Roundel size={36} />
          <div>
            <h1 style={{ lineHeight: 1.1 }}>AIMOS 360º Review</h1>
            <div className="muted" style={{ fontSize: 12 }}>{t("app.tagline")}</div>
          </div>
        </div>
        <div className="header-controls">
          <select
            className="pill-select"
            value={lang}
            onChange={(e) => changeLang(e.target.value)}
            title={t("header.language")}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          {data && (
            <div className="pill-group" role="group" aria-label="View mode">
              <button className={lmView ? "active" : ""} onClick={() => setLmView(true)}>{t("header.viewLm")}</button>
              <button className={!lmView ? "active" : ""} onClick={() => setLmView(false)}>{t("header.viewNormal")}</button>
            </div>
          )}
          {data && (
            <button className="pill-btn" onClick={exportPdf}>
              {t("header.print")}
            </button>
          )}
          {me?.isAdmin && <a className="pill-btn" href="#admin">{t("header.admin")}</a>}
          <button className="pill-btn" onClick={signOut}>{t("header.signout")}</button>
        </div>
      </header>

      {!data && (
        <Upload
          t={t}
          onParsed={(d) => {
            setData(d);
            setResults({
              synthesis: null,
              objectives: null,
              development: null,
              overviewStatement: "",
              savedAt: new Date().toISOString(),
              lastEditAt: new Date().toISOString(),
            });
            setErrors({ synthesis: null, objectives: null, development: null });
            setTab("overview");
          }}
          onPrevParsed={setPrevData}
          prevData={prevData}
          onClearPrev={() => setPrevData(null)}
          history={history}
          onLoadHistory={loadFromHistory}
          onDeleteHistory={removeFromHistory}
        />
      )}

      {data && (
        <>
          <TitleModule
            data={data}
            prevData={prevData}
            view={viewMode}
            t={t}
            onUploadDifferent={uploadDifferent}
            displayName={results.displayName}
            onUpdateDisplayName={updateDisplayName}
          />

          <div className="tabbar">
            {TABS.map((tabDef) => (
              <button key={tabDef.key} className={tab === tabDef.key ? "active" : ""} onClick={() => setTab(tabDef.key)}>
                {tabDef.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <Overview
              data={data}
              prevData={prevData}
              view={viewMode}
              t={t}
              overviewStatement={results.overviewStatement}
              synthesisSummary={results.synthesis?.summary}
              onUpdateOverview={updateOverviewStatement}
            />
          )}
          {tab === "values" && <Values data={data} view={viewMode} t={t} />}
          {tab === "synthesis" && (
            <Synthesis
              result={results.synthesis}
              loading={loading.synthesis}
              error={errors.synthesis}
              onRegenerate={() => runGenerator("synthesis")}
              view={viewMode}
              t={t}
              openFeedback={data.openFeedback}
              lang={lang}
              employeeName={results.displayName || data.employee?.name}
            />
          )}
          {tab === "objectives" && (
            <Objectives
              result={results.objectives}
              loading={loading.objectives}
              error={errors.objectives}
              onRegenerate={() => runGenerator("objectives")}
              onUpdate={updateObjective}
              view={viewMode}
              t={t}
            />
          )}
          {tab === "development" && (
            <Development
              result={results.development}
              loading={loading.development}
              error={errors.development}
              onRegenerate={() => runGenerator("development")}
              onUpdateRoot={updateDevRoot}
              onUpdateOpportunity={updateOpportunity}
              onUpdateBook={updateBook}
              view={viewMode}
              t={t}
            />
          )}
          {tab === "compare" && <Compare data={data} prevData={prevData} t={t} />}
          {tab === "info" && (
            <AppraisalInfo
              data={data}
              savedAt={results.savedAt}
              lastEditAt={results.lastEditAt}
              conductedBy={me?.email}
              t={t}
            />
          )}
        </>
      )}

      <div className="footer-note">
        {viewMode === "normal" && data && (
          <div style={{ marginBottom: 8 }}>{t("overview.scoresHidden")}</div>
        )}
        {t("footer.confidential")}
      </div>
    </div>
  );
}
