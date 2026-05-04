const TOKEN_KEY = "aimos.idToken";

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
export const HOSTED_DOMAIN = "manifest.group";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export function decodeToken(t) {
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload;
  } catch {
    return null;
  }
}

export function tokenIsFresh(t) {
  const p = decodeToken(t);
  if (!p || !p.exp) return false;
  return p.exp * 1000 > Date.now() + 30 * 1000;
}

let gisReady = null;

function waitForGis() {
  if (gisReady) return gisReady;
  gisReady = new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.google?.accounts?.id) return resolve(window.google.accounts.id);
      if (Date.now() - start > 8000) return reject(new Error("Google Identity Services failed to load."));
      setTimeout(tick, 50);
    };
    tick();
  });
  return gisReady;
}

export async function renderSignInButton(el, onCredential) {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("VITE_GOOGLE_CLIENT_ID is not configured.");
  }
  const gid = await waitForGis();
  gid.initialize({
    client_id: GOOGLE_CLIENT_ID,
    hosted_domain: HOSTED_DOMAIN,
    callback: (resp) => onCredential(resp.credential),
    ux_mode: "popup",
    auto_select: false,
  });
  gid.renderButton(el, { theme: "outline", size: "large", text: "signin_with", shape: "rectangular" });
}

export async function disableAutoSelect() {
  try {
    const gid = await waitForGis();
    gid.disableAutoSelect();
  } catch {}
}
