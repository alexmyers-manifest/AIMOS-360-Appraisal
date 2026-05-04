import { jwtVerify, createRemoteJWKSet } from "jose";

const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const HOSTED_DOMAIN = "manifest.group";

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function getBearer(req) {
  const h = req.headers.get?.("authorization") || req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export async function verifyRequest(req) {
  const audience = process.env.GOOGLE_CLIENT_ID;
  if (!audience) {
    return { ok: false, status: 500, error: "GOOGLE_CLIENT_ID env var not configured." };
  }
  const token = getBearer(req);
  if (!token) {
    return { ok: false, status: 401, error: "Missing bearer token." };
  }
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUERS,
      audience,
    });
    if (payload.hd !== HOSTED_DOMAIN) {
      return { ok: false, status: 403, error: "Account is not on the manifest.group workspace." };
    }
    if (!payload.email_verified) {
      return { ok: false, status: 403, error: "Email is not verified." };
    }
    const email = String(payload.email || "").toLowerCase();
    const isAdmin = adminEmails().includes(email);
    return { ok: true, email, name: payload.name, picture: payload.picture, isAdmin };
  } catch (e) {
    return { ok: false, status: 401, error: "Invalid or expired token: " + e.message };
  }
}

export function getAdminEmails() {
  return adminEmails();
}

export function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
