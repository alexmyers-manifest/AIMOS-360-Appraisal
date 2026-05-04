import { verifyRequest, jsonResponse } from "./lib/verifyToken.js";
import { isAllowed } from "./lib/allowlist.js";

export default async (req) => {
  const auth = await verifyRequest(req);
  if (!auth.ok) return jsonResponse(auth.status, { error: { message: auth.error } });

  const allowed = await isAllowed(auth.email);

  return jsonResponse(200, {
    email: auth.email,
    name: auth.name,
    picture: auth.picture,
    isAdmin: auth.isAdmin,
    isAllowed: allowed || auth.isAdmin,
  });
};
