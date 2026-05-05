import * as XLSX from "xlsx";
import _ from "lodash";

export const COMPETENCIES = [
  { key: "expertise", label: "Skills & Expertise", short: "skil", keywords: ["qualities, expertise and skills", "expected qualities"] },
  { key: "communication", label: "Communication & Collaboration", short: "comm", keywords: ["communicate and collaborate"] },
  { key: "ways_of_working", label: "Ways of Working", short: "ways", keywords: ["agreed ways of working"] },
  { key: "motivation", label: "Motivation", short: "moti", keywords: ["motivated is this person", "motivated in their role", "how motivated"] },
  { key: "potential", label: "Development Potential", short: "pote", keywords: ["potential for excellence"] },
];

export const VALUES_DEFS = [
  { key: "drive_it", short: "Drive it", full: "Don't react to the changing shape of the industry, drive it", keywords: ["don't react to the changing shape"] },
  { key: "remarkable", short: "Be remarkable", full: "Kick the shit out of the opportunity to be remarkable", keywords: ["kick the shit out"] },
  { key: "build_it", short: "Build it", full: "If you can't find what you're looking for, build it", keywords: ["if you can't find what you're looking for"] },
  { key: "impossible", short: "Healthy disregard", full: "Maintain a healthy disregard for the impossible", keywords: ["healthy disregard for the impossible"] },
  { key: "be_nice", short: "Work Hard + Be Nice", full: "Work hard and be nice to people", keywords: ["work hard & be nice"] },
];

export const OPEN_FIELDS = [
  { key: "strengths", keywords: ["success or achievement", "most proud of", "particular success"] },
  { key: "challenges", keywords: ["challenging or needs to improve", "finds challenging", "work in progress"] },
  { key: "advice", keywords: ["constructive advice", "compassionate feedback", "principle piece of"] },
  { key: "additional", keywords: ["add any context to your scores", "any other comments"] },
];

const matchCol = (h, kws) => {
  const l = h.toLowerCase();
  return kws.some((k) => l.includes(k.toLowerCase()));
};

const findCols = (headers, kws) => {
  const r = { rating: null, ratedValue: null, comment: null };
  for (const h of headers) {
    const hl = h.toLowerCase();
    if (!matchCol(h, kws)) continue;
    if (hl.endsWith("rating") && !r.rating) r.rating = h;
    if (hl.endsWith("rated value") && !r.ratedValue) r.ratedValue = h;
    if (hl.startsWith("comment on") && !r.comment) r.comment = h;
  }
  return r;
};

const findOpenCol = (headers, kws) => {
  for (const h of headers) {
    const hl = h.toLowerCase();
    if (hl.endsWith("rating") || hl.endsWith("rated value") || hl.startsWith("comment on")) continue;
    if (matchCol(h, kws)) return h;
  }
  return null;
};

function parseHibob(wb) {
  const sMap = { managers: "manager", peers: "peer", employees: "self" };
  const reviews = [];
  let employee = null;
  let dataDate = null;

  for (const sn of wb.SheetNames) {
    const rel = sMap[sn.toLowerCase()];
    if (!rel) continue;
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: "" });
    if (!rows.length) continue;
    const hdrs = Object.keys(rows[0]);

    if (!employee) {
      const gc = (kw) => {
        const c = hdrs.find((h) => h.toLowerCase().includes(kw));
        return c ? String(rows[0][c]).trim() : "";
      };
      employee = {
        name: gc("display name (employee)") || gc("full name (employee)"),
        email: gc("email (employee)"),
        jobTitle: gc("job title"),
        tenure: gc("accumulated tenure (duration)"),
        tenureYears: gc("accumulated tenure (years)"),
        site: gc("site (employee)"),
        reportsTo: gc("reports to"),
        pronouns: gc("pronouns"),
      };
    }

    const cc = COMPETENCIES.map((c) => ({ ...c, cols: findCols(hdrs, c.keywords) }));
    const vc = VALUES_DEFS.map((v) => ({ ...v, cols: findCols(hdrs, v.keywords) }));
    const oc = OPEN_FIELDS.map((f) => ({ ...f, col: findOpenCol(hdrs, f.keywords) }));

    const rnCol = hdrs.find((h) => {
      const l = h.toLowerCase();
      return l.startsWith("display name") && !l.includes("employee");
    });
    const rrCol = hdrs.find((h) => {
      const l = h.toLowerCase();
      return l === "reviewer rating" || l === sn.toLowerCase() + " rating";
    });
    const orCol = hdrs.find((h) => h.toLowerCase() === "overall rating");
    const stCol = hdrs.find((h) => {
      const l = h.toLowerCase();
      return l.includes("state") && !l.includes("employee");
    });
    const esCol = rel === "self" ? hdrs.find((h) => h.toLowerCase() === "state (employee)") : null;
    const subCol = hdrs.find((h) => h.toLowerCase() === "submitted on");
    const tenCol = hdrs.find((h) => {
      const l = h.toLowerCase();
      return l.includes("accumulated tenure (years)") && !l.includes("employee");
    });
    const siteCol = hdrs.find((h) => {
      const l = h.toLowerCase();
      return l.includes("site") && !l.includes("employee");
    });
    const elemCol = hdrs.find((h) => {
      const l = h.toLowerCase();
      return l.includes("element") && !l.includes("employee");
    });

    for (const row of rows) {
      const state = stCol ? String(row[stCol]).toLowerCase() : esCol ? String(row[esCol]).toLowerCase() : "";
      if (state && state !== "submitted") continue;

      const rName = rnCol ? String(row[rnCol]).trim() : rel === "self" ? employee.name : "Anonymous";
      const rTenure = tenCol ? parseFloat(row[tenCol]) || 0 : 0;
      const rSite = siteCol ? String(row[siteCol]).trim() : "";
      const rElem = elemCol ? String(row[elemCol]).trim() : "";
      const subDate = subCol ? String(row[subCol]).trim() : "";
      if (subDate && !dataDate) dataDate = subDate;

      const compScores = {};
      for (const comp of cc) {
        const sc = comp.cols.rating ? parseFloat(row[comp.cols.rating]) || null : null;
        const rv = comp.cols.ratedValue ? String(row[comp.cols.ratedValue]).trim() : "";
        const cm = comp.cols.comment ? String(row[comp.cols.comment]).trim() : "";
        if (sc !== null || cm) compScores[comp.key] = { score: sc, ratedValue: rv, comment: cm };
      }

      const valScores = {};
      for (const val of vc) {
        const sc = val.cols.rating ? parseFloat(row[val.cols.rating]) || null : null;
        const rv = val.cols.ratedValue ? String(row[val.cols.ratedValue]).trim() : "";
        if (sc !== null || rv) valScores[val.key] = { score: sc, ratedValue: rv };
      }

      const openText = {};
      for (const f of oc) {
        const t = f.col ? String(row[f.col]).trim() : "";
        if (t) openText[f.key] = t;
      }

      reviews.push({
        reviewer: rName,
        relation: rel,
        compScores,
        valScores,
        openText,
        reviewerRating: rrCol ? parseFloat(row[rrCol]) || null : null,
        overallRating: orCol ? parseFloat(row[orCol]) || null : null,
        tenure: rTenure,
        site: rSite,
        element: rElem,
        submittedOn: subDate,
      });
    }
  }

  if (!employee || !reviews.length) throw new Error("Could not parse HiBob data.");

  const compSummary = COMPETENCIES.map((c) => {
    const scored = reviews.filter((r) => r.compScores[c.key] && r.compScores[c.key].score != null);
    const selfR = reviews.find((r) => r.relation === "self" && r.compScores[c.key] && r.compScores[c.key].score != null);
    const mgrR = reviews.find((r) => r.relation === "manager" && r.compScores[c.key] && r.compScores[c.key].score != null);
    const peerRs = reviews.filter((r) => r.relation === "peer" && r.compScores[c.key] && r.compScores[c.key].score != null);
    const selfScore = selfR ? selfR.compScores[c.key].score : null;
    const mgrScore = mgrR ? mgrR.compScores[c.key].score : null;
    const peerAvg = peerRs.length ? _.meanBy(peerRs, (r) => r.compScores[c.key].score) : null;
    const gaps = [];
    if (selfScore != null && peerAvg != null && Math.abs(selfScore - peerAvg) >= 2) {
      gaps.push("Self " + (selfScore < peerAvg ? "" : "+") + (selfScore - peerAvg).toFixed(1) + " vs Peers");
    }
    if (selfScore != null && mgrScore != null && Math.abs(selfScore - mgrScore) >= 2) {
      gaps.push("Self " + (selfScore < mgrScore ? "" : "+") + (selfScore - mgrScore).toFixed(0) + " vs Mgr");
    }
    return {
      key: c.key,
      label: c.label,
      short: c.short,
      avgScore: scored.length ? _.meanBy(scored, (r) => r.compScores[c.key].score) : null,
      selfScore,
      managerScore: mgrScore,
      peerAvg: peerAvg != null ? parseFloat(peerAvg.toFixed(1)) : null,
      gaps,
      reviews: reviews
        .filter((r) => r.compScores[c.key])
        .map((r) => ({
          reviewer: r.reviewer,
          relation: r.relation,
          score: r.compScores[c.key].score,
          comment: r.compScores[c.key].comment,
          tenure: r.tenure,
          element: r.element,
        })),
    };
  });

  const valSummary = VALUES_DEFS.map((v) => {
    const selfR = reviews.find((r) => r.relation === "self" && r.valScores[v.key] && r.valScores[v.key].score != null);
    const mgrR = reviews.find((r) => r.relation === "manager" && r.valScores[v.key] && r.valScores[v.key].score != null);
    const peerRs = reviews.filter((r) => r.relation === "peer" && r.valScores[v.key] && r.valScores[v.key].score != null);
    const selfScore = selfR ? selfR.valScores[v.key].score : null;
    const mgrScore = mgrR ? mgrR.valScores[v.key].score : null;
    const peerAvg = peerRs.length ? parseFloat(_.meanBy(peerRs, (r) => r.valScores[v.key].score).toFixed(1)) : null;
    return {
      key: v.key,
      short: v.short,
      full: v.full,
      selfScore,
      managerScore: mgrScore,
      peerAvg,
      selfLabel: selfR ? selfR.valScores[v.key].ratedValue : "",
      reviews: reviews
        .filter((r) => r.valScores[v.key])
        .map((r) => ({
          reviewer: r.reviewer,
          relation: r.relation,
          score: r.valScores[v.key].score,
          ratedValue: r.valScores[v.key].ratedValue,
        })),
    };
  });

  const openFeedback = {};
  for (const f of OPEN_FIELDS) {
    openFeedback[f.key] = reviews
      .filter((r) => r.openText[f.key])
      .map((r) => ({
        reviewer: r.reviewer,
        relation: r.relation,
        text: r.openText[f.key],
        tenure: r.tenure,
        element: r.element,
        site: r.site,
      }));
  }

  const peerRatings = reviews.filter((r) => r.relation === "peer" && r.reviewerRating != null);
  const submittedPeers = reviews.filter((r) => r.relation === "peer");
  const mgr = reviews.find((r) => r.relation === "manager") || {};
  const self = reviews.find((r) => r.relation === "self") || {};

  const ratings = {
    manager: mgr.reviewerRating || null,
    managerName: mgr.reviewer || "",
    peerAvg: peerRatings.length ? parseFloat(_.meanBy(peerRatings, "reviewerRating").toFixed(1)) : null,
    peerCount: submittedPeers.length,
    self: self.reviewerRating || null,
    overall: reviews[0] ? reviews[0].overallRating : null,
  };

  return { employee, reviews, compSummary, valSummary, openFeedback, ratings, dataDate };
}

function readFile(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = (e) => res(e.target.result);
    reader.onerror = () => rej(new Error("Failed to read " + file.name));
    if (file.name.match(/\.csv$/i)) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
}

export async function parseFiles(files) {
  const sheets = {};
  const sheetNames = [];
  for (const f of files) {
    const buf = await readFile(f);
    const wb = XLSX.read(buf, { type: f.name.match(/\.csv$/i) ? "string" : "array" });
    for (const n of wb.SheetNames) {
      const key = sheets[n] ? n + "_" + f.name : n;
      sheets[key] = wb.Sheets[n];
      sheetNames.push(key);
    }
  }
  return parseHibob({ SheetNames: sheetNames, Sheets: sheets });
}
