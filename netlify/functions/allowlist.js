import { verifyRequest, jsonResponse, getAdminEmails } from "./lib/verifyToken.js";
import { readAllowlist, writeAllowlist, isAllowed } from "./lib/allowlist.js";

const HOSTED_DOMAIN = "manifest.group";

export default async (req) => {
  const auth = await verifyRequest(req);
  if (!auth.ok) return jsonResponse(auth.status, { error: { message: auth.error } });

  if (req.method === "GET") {
    if (!(await isAllowed(auth.email)) && !auth.isAdmin) {
      return jsonResponse(403, { error: { message: "Not allowed." } });
    }
    const allowlist = await readAllowlist();
    return jsonResponse(200, { allowlist, admins: getAdminEmails() });
  }

  if (!auth.isAdmin) {
    return jsonResponse(403, { error: { message: "Admin only." } });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return jsonResponse(400, { error: { message: "Provide a valid email." } });
    }
    if (!email.endsWith("@" + HOSTED_DOMAIN)) {
      return jsonResponse(400, { error: { message: "Only @" + HOSTED_DOMAIN + " accounts can be added." } });
    }
    const list = await readAllowlist();
    if (!list.includes(email)) list.push(email);
    const next = await writeAllowlist(list);
    return jsonResponse(200, { allowlist: next, admins: getAdminEmails() });
  }

  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const email = String(url.searchParams.get("email") || "").trim().toLowerCase();
    if (!email) return jsonResponse(400, { error: { message: "Provide ?email=..." } });
    const list = await readAllowlist();
    const next = await writeAllowlist(list.filter((e) => e !== email));
    return jsonResponse(200, { allowlist: next, admins: getAdminEmails() });
  }

  return jsonResponse(405, { error: { message: "Method not allowed." } });
};
