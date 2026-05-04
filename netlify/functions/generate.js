import Anthropic from "@anthropic-ai/sdk";
import { verifyRequest, jsonResponse } from "./lib/verifyToken.js";
import { isAllowed } from "./lib/allowlist.js";
import { AI_SYS, buildUserPrompt, fallback, extractJSON } from "./lib/prompts.js";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 16000;

export default async (req) => {
  if (req.method !== "POST") {
    return jsonResponse(405, { error: { message: "Method not allowed." } });
  }

  const auth = await verifyRequest(req);
  if (!auth.ok) return jsonResponse(auth.status, { error: { message: auth.error } });

  if (!auth.isAdmin && !(await isAllowed(auth.email))) {
    return jsonResponse(403, { error: { message: "Not on allowlist." } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: { message: "ANTHROPIC_API_KEY not configured." } });
  }

  const body = await req.json().catch(() => ({}));
  const { type, data } = body;
  if (!["synthesis", "objectives", "development"].includes(type)) {
    return jsonResponse(400, { error: { message: "Invalid type." } });
  }
  if (!data || !data.employee) {
    return jsonResponse(400, { error: { message: "Missing parsed appraisal data." } });
  }

  const userPrompt = buildUserPrompt(type, data);

  const client = new Anthropic({ apiKey });

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [{ type: "text", text: AI_SYS, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = (resp.content || []).map((b) => b.text || "").join("");
    let parsed;
    try {
      parsed = extractJSON(text);
    } catch {
      parsed = fallback(type);
    }
    return jsonResponse(200, parsed);
  } catch (err) {
    return jsonResponse(500, {
      error: { message: "AI error: " + (err?.message || String(err)) },
    });
  }
};
