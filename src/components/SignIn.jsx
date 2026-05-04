import { useEffect, useRef, useState } from "react";
import { renderSignInButton, GOOGLE_CLIENT_ID } from "../lib/auth.js";

export default function SignIn({ onSignedIn, error }) {
  const ref = useRef(null);
  const [renderErr, setRenderErr] = useState(null);

  useEffect(() => {
    if (!ref.current) return;
    renderSignInButton(ref.current, onSignedIn).catch((e) => setRenderErr(e.message));
  }, [onSignedIn]);

  return (
    <div className="signin">
      <div className="panel">
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>AIMOS 360º Review</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          Sign in with your Manifest Google account to continue.
        </p>
        <div ref={ref} style={{ display: "inline-block" }} />
        {!GOOGLE_CLIENT_ID && (
          <p className="error" style={{ marginTop: 16 }}>
            Google Client ID is not configured. Set <code>GOOGLE_CLIENT_ID</code> in Netlify env vars
            and redeploy.
          </p>
        )}
        {renderErr && <p className="error" style={{ marginTop: 16 }}>{renderErr}</p>}
        {error && <p className="error" style={{ marginTop: 16 }}>{error}</p>}
        <p className="muted" style={{ marginTop: 24, fontSize: 12 }}>
          Restricted to <strong>@manifest.group</strong> accounts on the AIMOS allowlist.
        </p>
      </div>
    </div>
  );
}
