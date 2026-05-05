export const AI_SYS =
  "You are an HR appraisal analyst for Manifest, a B-Corp brand communications agency. Output valid JSON only. No markdown, no backticks, no preamble.";

function languageInstruction(lang) {
  if (lang === "sv") {
    return "Respond entirely in Swedish (svenska). Use natural Swedish HR/business language. Keep JSON keys in English; only the values inside strings should be Swedish.";
  }
  if (lang === "en-US") {
    return "Respond in American English. Use US spelling (organize, behavior, prioritize, anonymize) and US idioms.";
  }
  return "Respond in British English. Use UK spelling (organise, behaviour, prioritise, anonymise) and UK idioms.";
}

function buildDataContext(data) {
  const emp = data.employee;
  const compStr = (data.compSummary || [])
    .map(
      (c) =>
        c.label +
        ": self=" +
        (c.selfScore || "N/A") +
        " peers=" +
        (c.peerAvg || "N/A") +
        " mgr=" +
        (c.managerScore || "N/A") +
        (c.gaps && c.gaps.length ? " GAPS=[" + c.gaps.join(", ") + "]" : "")
    )
    .join("\n");
  const valStr = (data.valSummary || [])
    .map(
      (v) =>
        v.short +
        ": self=" +
        (v.selfScore || "N/A") +
        " peers=" +
        (v.peerAvg || "N/A") +
        " mgr=" +
        (v.managerScore || "N/A")
    )
    .join("\n");
  const feedback = Object.entries(data.openFeedback || {})
    .flatMap((e) =>
      e[1].slice(0, 3).map((item) => "[" + item.relation + "/" + e[0] + "] " + item.text.slice(0, 200))
    )
    .slice(0, 10)
    .join("\n\n");
  return (
    "Employee: " +
    emp.name +
    " (" +
    emp.jobTitle +
    ")\nTenure: " +
    emp.tenure +
    "\nReports to: " +
    emp.reportsTo +
    "\nOverall: " +
    (data.ratings.overall || "N/A") +
    "\nPeer count: " +
    data.ratings.peerCount +
    ", Peer avg: " +
    (data.ratings.peerAvg || "N/A") +
    ", Self: " +
    (data.ratings.self || "N/A") +
    ", Manager: " +
    (data.ratings.manager || "N/A") +
    "\n\nCompetencies (1-10):\n" +
    compStr +
    "\n\nValues (1-4):\n" +
    valStr +
    "\n\nFeedback excerpts:\n" +
    feedback
  );
}

const SYNTHESIS_TAIL =
  '\n\nRespond with ONLY a JSON object (no other text). Structure:\n{"summary":"2-3 sentence summary","highlightQuote":{"text":"one standout anonymised quote","attribution":"role, tenure"},"strengths":[{"title":"Theme","body":"2-3 sentences","quote":"short quote","quoteAttr":"role, tenure"}],"development":[{"title":"Theme","body":"2-3 sentences","selfAwareness":"self-review perspective","recommendation":"actionable step"}],"agreedPriority":"one sentence"}\nInclude exactly 3 strengths and 3 development themes. Anonymise all names — use role/department/tenure only.';

const OBJECTIVES_TAIL =
  '\n\nRespond with ONLY a JSON object (no other text). Structure:\n{"objectives":[{"pillar":"Performance","color":"#0a45ce","icon":"↑","statement":"objective","fastCriteria":"one sentence on FAST alignment","rationale":"why based on data","measure":"how to measure"},{"pillar":"Product — The Work","color":"#434343","icon":"✦","statement":"...","fastCriteria":"...","rationale":"...","measure":"..."},{"pillar":"People","color":"#02614b","icon":"◎","statement":"...","fastCriteria":"...","rationale":"...","measure":"..."},{"pillar":"Purpose","color":"#fc5c40","icon":"⬡","statement":"...","fastCriteria":"...","rationale":"...","measure":"..."}]}\nAnchor each to specific appraisal data. Keep each field concise (1-2 sentences max).';

const DEVELOPMENT_TAIL =
  '\n\nRespond with ONLY a JSON object (no other text). Structure:\n{"coachingFocus":"one sentence priority","opportunities":[{"type":"Coaching","color":"#0a45ce","gap":"skill gap","description":"what to do"},{"type":"Course","color":"#02614b","gap":"...","description":"..."},{"type":"Peer learning","color":"#434343","gap":"...","description":"..."},{"type":"Stretch assignment","color":"#fc5c40","gap":"...","description":"..."},{"type":"Reading","color":"#000000","gap":"...","description":"..."}],"books":[{"title":"Title","author":"Author","rationale":"why for this person","amazonUrl":"https://www.amazon.co.uk/s?k=Title+Author"}]}\nInclude 5 opportunities and 4 books. Anchor all to appraisal data. Keep descriptions concise (1-2 sentences).';

const FALLBACKS = {
  synthesis: () => ({
    summary: "AI analysis could not be parsed. Try regenerating.",
    strengths: [],
    development: [],
    highlightQuote: null,
    agreedPriority: "",
  }),
  objectives: () => ({ objectives: [] }),
  development: () => ({
    coachingFocus: "L&D plan could not be parsed. Try regenerating.",
    opportunities: [],
    books: [],
  }),
};

export function buildUserPrompt(type, data, lang = "en-GB") {
  const ctx = buildDataContext(data);
  const langLine = "\n\n" + languageInstruction(lang);
  if (type === "synthesis") return ctx + SYNTHESIS_TAIL + langLine;
  if (type === "objectives") return ctx + OBJECTIVES_TAIL + langLine;
  if (type === "development") return ctx + DEVELOPMENT_TAIL + langLine;
  throw new Error("Unknown generator type: " + type);
}

export function fallback(type) {
  return (FALLBACKS[type] || (() => ({})))();
}

export function extractJSON(raw) {
  let s = String(raw || "").replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.substring(start, end + 1);
  return JSON.parse(s);
}
