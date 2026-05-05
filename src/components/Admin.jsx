import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import Roundel from "./Roundel.jsx";

export default function Admin({ me, onSignOut }) {
  const [list, setList] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  function load() {
    setError(null);
    api
      .listAllowlist()
      .then((r) => {
        setList(r.allowlist || []);
        setAdmins(r.admins || []);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function add(e) {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setAdding(true);
    setError(null);
    try {
      await api.addAllowlist(email);
      setNewEmail("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function remove(email) {
    if (!confirm("Remove " + email + " from the allowlist?")) return;
    setError(null);
    try {
      await api.removeAllowlist(email);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="shell">
      <header className="header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Roundel size={36} />
          <h1>AIMOS 360º — Admin</h1>
        </div>
        <div className="who">
          <a href="#" style={{ marginRight: 12 }}>Back to app</a>
          {me?.email} <button className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={onSignOut}>Sign out</button>
        </div>
      </header>

      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>Admins</div>
        {admins.map((a) => (
          <span key={a} className="pill pill-admin" style={{ marginRight: 6 }}>{a}</span>
        ))}
        <p className="muted" style={{ marginTop: 12, fontSize: 12 }}>
          Admins are configured via the <code>ADMIN_EMAILS</code> env var on Netlify, not editable here.
        </p>
      </div>

      <div className="card">
        <div className="section-h" style={{ marginTop: 0 }}>Allowlist</div>
        <form onSubmit={add} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            className="input"
            type="email"
            placeholder="someone@manifest.group"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button className="btn" disabled={adding}>{adding ? "Adding…" : "Add"}</button>
        </form>

        {error && <p className="error">{error}</p>}

        {list === null && <p className="muted"><span className="spinner" />Loading…</p>}
        {list?.length === 0 && <p className="muted">No allowlisted users yet.</p>}
        {list?.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((email) => (
                <tr key={email}>
                  <td>
                    {email}
                    {admins.includes(email) && <span className="pill pill-admin" style={{ marginLeft: 8 }}>admin</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btn-secondary" onClick={() => remove(email)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
