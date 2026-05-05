// Lightweight word-frequency + sentiment classifier for the 360 feedback tab.
// English only — Swedish output flows through but is rendered as neutral grey
// (no Swedish sentiment lexicon shipped). Replace POSITIVE/NEGATIVE if a
// Manifest-curated list lands later.

const STOPWORDS = new Set(
  "a about above after again against all am an and any are aren as at be because been before being below between both but by can cannot could couldn did didn do does doesn doing don down during each few for from further had hadn has hasn have haven having he her here hers herself him himself his how i if in into is isn it its itself just let ll me might more most mustn my myself need needn no nor not now of off on once only or other ought our ours ourselves out over own re s same shan she should shouldn so some such t than that the their theirs them themselves then there these they this those through to too under until up ve very was wasn we were weren what when where which while who whom why will with won would wouldn y you your yours yourself yourselves also even much many really very simply often always sometimes around quite still etc said say says see seen take get got make made done thing things people something someone anyone everyone nothing"
    .split(/\s+/)
);

const POSITIVE = new Set(
  ("excellent great strong brilliant outstanding exceptional impressive talented skilled capable " +
    "reliable dependable trustworthy honest fair kind generous supportive collaborative thoughtful " +
    "considerate calm focused organised organized efficient productive creative innovative inspiring " +
    "motivating positive optimistic confident ambitious driven dedicated committed passionate " +
    "enthusiastic energetic proactive professional polished articulate clear sharp smart " +
    "intelligent wise knowledgeable experienced expert leader leading leads helpful supports " +
    "mentor mentoring teaches learning growing growth improvement improving improved success " +
    "successful win wins achieve achieved achievement achievements exceeds delivered delivers " +
    "delivery quality excellence best better good amazing fantastic wonderful perfect ideal " +
    "valuable valued asset contribution contributes contributed strength strengths exceptional " +
    "thorough rigorous diligent careful precise consistent steady patient calm composed warm " +
    "open empathetic generous bright effective high impactful insight insightful curious " +
    "engaged engaging adaptable flexible resilient brave bold ambitious championing champions " +
    "ownership accountable accountability rigour rigor depth")
    .split(/\s+/)
);

const NEGATIVE = new Set(
  ("weak poor struggling struggles struggle difficult hard challenge challenges challenging " +
    "problem problems issue issues concern concerns concerning worry worried worrying frustrated " +
    "frustrating frustration anxious anxiety stress stressed stressful overwhelmed overwhelming " +
    "overwhelm slow slower late missed missing miss fail failed failing failure failures mistake " +
    "mistakes error errors wrong incorrect inaccurate sloppy careless lazy unmotivated disengaged " +
    "disconnected withdrawn quiet silent defensive dismissive rude harsh abrupt blunt unclear " +
    "confused confusing confusion vague unfocused scattered disorganised disorganized inefficient " +
    "unproductive inconsistent unreliable unpredictable conflict conflicts tension friction " +
    "resistant stubborn inflexible narrow limited lacks lacking lack gap gaps behind delayed " +
    "delays blocked blocking blocker stuck plateau regress regression declined decline drop " +
    "underperform underperforming underdelivered underdelivers risk risks risky drops " +
    "complacent complacency avoidant avoidance reluctant reluctance hesitant hesitation " +
    "fragile distracted distracting tense rigid abrasive critical heavy slowdown silos siloed")
    .split(/\s+/)
);

function classify(word) {
  if (POSITIVE.has(word)) return "pos";
  if (NEGATIVE.has(word)) return "neg";
  return "neu";
}

function tokenize(text, excludeSet) {
  return String(text || "")
    .toLowerCase()
    .replace(/[‘’']/g, "")
    .replace(/[^a-zåäö]+/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w) && !excludeSet.has(w));
}

function buildExcludeSet(employeeName) {
  const set = new Set();
  if (!employeeName) return set;
  const cleaned = String(employeeName)
    .toLowerCase()
    .replace(/[^a-zåäö\s]+/gi, " ")
    .split(/\s+/)
    .filter((p) => p.length >= 2);
  for (const part of cleaned) set.add(part);
  return set;
}

export function buildWordCloud(openFeedback, lang = "en-GB", limit = 40, employeeName = "") {
  if (!openFeedback) return [];
  const exclude = buildExcludeSet(employeeName);
  const counts = new Map();
  for (const list of Object.values(openFeedback)) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      for (const tok of tokenize(item.text, exclude)) {
        counts.set(tok, (counts.get(tok) || 0) + 1);
      }
    }
  }

  const sorted = Array.from(counts.entries())
    .filter(([, n]) => n >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const max = sorted[0]?.[1] || 1;
  const min = sorted[sorted.length - 1]?.[1] || 1;
  const isEnglish = lang === "en-GB" || lang === "en-US" || lang === "en-AU";

  return sorted.map(([word, count]) => {
    const t = (count - min) / Math.max(1, max - min);
    return {
      word,
      count,
      size: 14 + Math.round(t * 22),
      polarity: isEnglish ? classify(word) : "neu",
    };
  });
}
