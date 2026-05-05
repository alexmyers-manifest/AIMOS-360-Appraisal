import { useEffect, useMemo, useState } from "react";
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
import SignIn from "./components/SignIn.jsx";
import Upload from "./components/Upload.jsx";
import Overview from "./components/Overview.jsx";
import Analysis from "./components/Analysis.jsx";
import Values from "./components/Values.jsx";
import Synthesis from "./components/Synthesis.jsx";
import Objectives from "./components/Objectives.jsx";
import Development from "./components/Development.jsx";
import Compare from "./components/Compare.jsx";
import Admin from "./components/Admin.jsx";
import Roundel from "./components/Roundel.jsx";
import PrintView from "./components/PrintView.jsx";

export default function App() {
  const [me, setMe] = useState(null);
  const [meErr, setMeErr] = useState(null);
  const [view, setViewState] = useState("loading");
  const [route, setRoute] = useState(window.location.hash === "#admin" ? "admin" : "app");

  const [data, setData] = useState(null);
  const [prevData, setPrevData] = useState(null);
  const [tab, setTab] = useState("overview");

  const [results, setResults] = useState({ synthesis: null, objectives: null, development: null });
  const [loading, setLoading] = useState({ synthesis: false, objectives: false, development: false });
  const [errors, setErrors] = useState({ synthesis: null, objectives: null, development: null });

  const [lmView, setLmView] = useState(true);
  const [lang, setLang] = useState(getLang());
  const [history, setHistory] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const t = useMemo(() => makeT(lang), [lang]);

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

  // Hydrate session and history once we have a signed-in user
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

  // Persist session on changes
  useEffect(() => {
    if (!me?.email || !hydrated) return;
    saveSession(me.email, { data, prevData, results, lmView });
  }, [me, hydrated, data, prevData, results, lmView]);

  // Persist to history when data is present and AI results land
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
    });
    setHistory(next);
  }, [me, hydrated, data, prevData, results.synthesis, results.objectives, results.development]);

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
    setResults({ synthesis: null, objectives: null, development: null });
    setHistory([]);
    setHydrated(false);
    disableAutoSelect();
    setViewState("signin");
  }

  async function runGenerator(type) {
    if (!data) return;
    setLoading((l) => ({ ...l, [type]: true }));
    setErrors((e) => ({ ...e, [type]: null }));
    try {
      const out = await api.generate(type, data, lang);
      setResults((r) => ({ ...r, [type]: out }));
    } catch (e) {
      setErrors((er) => ({ ...er, [type]: e.message }));
    } finally {
      setLoading((l) => ({ ...l, [type]: false }));
    }
  }

  // Chained AI generation
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
    });
    setErrors({ synthesis: null, objectives: null, development: null });
    setTab("overview");
  }

  function removeFromHistory(hk) {
    if (!me?.email) return;
    const next = deleteFromHistory(me.email, hk);
    setHistory(next);
  }

  // Editable mutations
  const updateObjective = (i, patch) =>
    setResults((r) => {
      if (!r.objectives) return r;
      const list = (r.objectives.objectives || []).slice();
      list[i] = { ...list[i], ...patch };
      return { ...r, objectives: { ...r.objectives, objectives: list } };
    });
  const updateDevRoot = (patch) =>
    setResults((r) => (r.development ? { ...r, development: { ...r.development, ...patch } } : r));
  const updateOpportunity = (i, patch) =>
    setResults((r) => {
      if (!r.development) return r;
      const list = (r.development.opportunities || []).slice();
      list[i] = { ...list[i], ...patch };
      return { ...r, development: { ...r.development, opportunities: list } };
    });
  const updateBook = (i, patch) =>
    setResults((r) => {
      if (!r.development) return r;
      const list = (r.development.books || []).slice();
      list[i] = { ...list[i], ...patch };
      return { ...r, development: { ...r.development, books: list } };
    });

  if (view === "loading") {
    return (
      <div className="shell screen-only">
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
          <button className="btn-secondary btn" onClick={signOut}>{t("header.signout")}</button>
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
    { key: "analysis", label: t("tab.analysis") },
    { key: "values", label: t("tab.values") },
    { key: "synthesis", label: t("tab.synthesis") },
    { key: "objectives", label: t("tab.objectives") },
    { key: "development", label: t("tab.development") },
    ...(prevData ? [{ key: "compare", label: t("tab.compare") }] : []),
  ];

  const viewMode = lmView ? "lm" : "normal";

  return (
    <>
      <div className="shell screen-only">
        <header className="header no-print">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Roundel size={36} />
            <div>
              <h1 style={{ lineHeight: 1.1 }}>AIMOS 360º Review</h1>
              <div className="muted" style={{ fontSize: 12 }}>{t("app.tagline")}</div>
            </div>
          </div>
          <div className="who" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <select
              className="lang-select"
              value={lang}
              onChange={(e) => changeLang(e.target.value)}
              title={t("header.language")}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            {data && (
              <div className="toggle" role="group" aria-label="View mode">
                <button className={lmView ? "active" : ""} onClick={() => setLmView(true)}>{t("header.viewLm")}</button>
                <button className={!lmView ? "active" : ""} onClick={() => setLmView(false)}>{t("header.viewNormal")}</button>
              </div>
            )}
            {data && (
              <button className="btn btn-secondary" onClick={() => window.print()}>
                {t("header.print")}
              </button>
            )}
            {me?.isAdmin && <a href="#admin">{t("header.admin")}</a>}
            <span className="muted" style={{ fontSize: 12 }}>{me?.email}</span>
            <button className="btn btn-secondary" onClick={signOut}>{t("header.signout")}</button>
          </div>
        </header>

        {!data && (
          <Upload
            t={t}
            onParsed={(d) => {
              setData(d);
              setResults({ synthesis: null, objectives: null, development: null });
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
            <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <strong>{data.employee.name}</strong>
                <span className="muted"> — {data.employee.jobTitle}</span>
                {viewMode === "lm" && (
                  <div className="muted" style={{ fontSize: 13 }}>
                    {data.ratings.peerCount} peer reviews · self {data.ratings.self ?? "—"} · manager {data.ratings.manager ?? "—"} · overall {data.ratings.overall ?? "—"}
                  </div>
                )}
                {prevData && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    Comparing against {prevData.employee?.name} · {prevData.dataDate || "—"}
                  </div>
                )}
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setData(null);
                  setPrevData(null);
                  setResults({ synthesis: null, objectives: null, development: null });
                  setErrors({ synthesis: null, objectives: null, development: null });
                }}
              >
                Upload different file
              </button>
            </div>

            <div className="tabbar no-print">
              {TABS.map((tabDef) => (
                <button key={tabDef.key} className={tab === tabDef.key ? "active" : ""} onClick={() => setTab(tabDef.key)}>
                  {tabDef.label}
                </button>
              ))}
            </div>

            {tab === "overview" && <Overview data={data} prevData={prevData} view={viewMode} t={t} />}
            {tab === "analysis" && <Analysis data={data} prevData={prevData} view={viewMode} t={t} />}
            {tab === "values" && <Values data={data} view={viewMode} t={t} />}
            {tab === "synthesis" && (
              <Synthesis
                result={results.synthesis}
                loading={loading.synthesis}
                error={errors.synthesis}
                onRegenerate={() => runGenerator("synthesis")}
                view={viewMode}
                t={t}
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
          </>
        )}

        <div className="muted" style={{ fontSize: 11, marginTop: 32, textAlign: "center" }}>
          {t("footer.confidential")}
        </div>
      </div>

      <PrintView data={data} prevData={prevData} results={results} view={viewMode} t={t} />
    </>
  );
}
