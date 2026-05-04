import { useEffect, useState } from "react";
import { api } from "./lib/api.js";
import { getStoredToken, setStoredToken, tokenIsFresh, disableAutoSelect } from "./lib/auth.js";
import SignIn from "./components/SignIn.jsx";
import Upload from "./components/Upload.jsx";
import Synthesis from "./components/Synthesis.jsx";
import Objectives from "./components/Objectives.jsx";
import Development from "./components/Development.jsx";
import Admin from "./components/Admin.jsx";

const TABS = [
  { key: "synthesis", label: "Synthesis" },
  { key: "objectives", label: "Objectives" },
  { key: "development", label: "Development" },
];

export default function App() {
  const [me, setMe] = useState(null);
  const [meErr, setMeErr] = useState(null);
  const [view, setView] = useState("loading");
  const [route, setRoute] = useState(window.location.hash === "#admin" ? "admin" : "app");
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("synthesis");
  const [results, setResults] = useState({ synthesis: null, objectives: null, development: null });
  const [loading, setLoading] = useState({ synthesis: false, objectives: false, development: false });
  const [errors, setErrors] = useState({ synthesis: null, objectives: null, development: null });

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash === "#admin" ? "admin" : "app");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const t = getStoredToken();
    if (!t || !tokenIsFresh(t)) {
      setStoredToken(null);
      setView("signin");
      return;
    }
    api
      .me()
      .then((m) => {
        setMe(m);
        if (!m.isAllowed) setView("notAllowed");
        else setView("app");
      })
      .catch((e) => {
        setMeErr(e.message);
        setView("signin");
      });
  }, []);

  function onSignedIn(token) {
    setStoredToken(token);
    setView("loading");
    api
      .me()
      .then((m) => {
        setMe(m);
        if (!m.isAllowed) setView("notAllowed");
        else setView("app");
      })
      .catch((e) => {
        setMeErr(e.message);
        setView("signin");
      });
  }

  function signOut() {
    setStoredToken(null);
    setMe(null);
    setData(null);
    setResults({ synthesis: null, objectives: null, development: null });
    disableAutoSelect();
    setView("signin");
  }

  async function runGenerator(type) {
    if (!data) return;
    setLoading((l) => ({ ...l, [type]: true }));
    setErrors((e) => ({ ...e, [type]: null }));
    try {
      const out = await api.generate(type, data);
      setResults((r) => ({ ...r, [type]: out }));
    } catch (e) {
      setErrors((er) => ({ ...er, [type]: e.message }));
    } finally {
      setLoading((l) => ({ ...l, [type]: false }));
    }
  }

  useEffect(() => {
    if (!data || results.synthesis || loading.synthesis) return;
    runGenerator("synthesis");
  }, [data]);

  useEffect(() => {
    if (!data || !results.synthesis || results.objectives || loading.objectives) return;
    runGenerator("objectives");
  }, [results.synthesis]);

  useEffect(() => {
    if (!data || !results.objectives || results.development || loading.development) return;
    runGenerator("development");
  }, [results.objectives]);

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
          <button className="btn-secondary btn" onClick={signOut}>Sign out</button>
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

  return (
    <div className="shell">
      <header className="header">
        <h1>AIMOS 360º Review</h1>
        <div className="who">
          {me?.isAdmin && <a href="#admin" style={{ marginRight: 12 }}>Admin</a>}
          {me?.email} <button className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={signOut}>Sign out</button>
        </div>
      </header>

      {!data && (
        <Upload
          onParsed={(d) => {
            setData(d);
            setResults({ synthesis: null, objectives: null, development: null });
            setErrors({ synthesis: null, objectives: null, development: null });
            setTab("synthesis");
          }}
        />
      )}

      {data && (
        <>
          <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{data.employee.name}</strong>
              <span className="muted"> — {data.employee.jobTitle}</span>
              <div className="muted" style={{ fontSize: 13 }}>
                {data.ratings.peerCount} peer reviews · self {data.ratings.self ?? "—"} · manager {data.ratings.manager ?? "—"} · overall {data.ratings.overall ?? "—"}
              </div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setData(null);
                setResults({ synthesis: null, objectives: null, development: null });
                setErrors({ synthesis: null, objectives: null, development: null });
              }}
            >
              Upload different file
            </button>
          </div>

          <div className="tabbar">
            {TABS.map((t) => (
              <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "synthesis" && (
            <Synthesis
              result={results.synthesis}
              loading={loading.synthesis}
              error={errors.synthesis}
              onRegenerate={() => runGenerator("synthesis")}
            />
          )}
          {tab === "objectives" && (
            <Objectives
              result={results.objectives}
              loading={loading.objectives}
              error={errors.objectives}
              onRegenerate={() => runGenerator("objectives")}
            />
          )}
          {tab === "development" && (
            <Development
              result={results.development}
              loading={loading.development}
              error={errors.development}
              onRegenerate={() => runGenerator("development")}
            />
          )}
        </>
      )}
    </div>
  );
}
