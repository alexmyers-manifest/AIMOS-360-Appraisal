// Builds a self-contained, printable HTML document from the current
// appraisal state. Mirrors the artifact's export approach: single static
// page, all styles inline, hard page-breaks between sections, ready for
// the browser's print-to-PDF.

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtDelta = (from, to) => {
  if (from == null || to == null) return "—";
  const d = Number(to) - Number(from);
  if (Math.abs(d) < 0.05) return "±0";
  return (d > 0 ? "▲" : "▼") + " " + Math.abs(d).toFixed(1);
};

function styles() {
  return `
@page { size: A4; margin: 14mm; }
* { box-sizing: border-box; }
body {
  font-family: "PP Neue Montreal", "Neue Haas Grotesk", "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: #000; background: #fff; margin: 0; padding: 0; font-size: 10pt; line-height: 1.5;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
h1 { font-size: 22pt; letter-spacing: -0.02em; margin: 0 0 4px; font-weight: 600; }
h2 { font-size: 14pt; letter-spacing: -0.02em; margin: 0 0 12px; padding-bottom: 4px; border-bottom: 1px solid #ddd; font-weight: 600; }
h3 { font-size: 11pt; margin: 0 0 4px; font-weight: 600; }
.muted { color: #767676; }
.section { page-break-before: always; break-before: page; padding-top: 0; }
.section:first-of-type { page-break-before: auto; break-before: auto; }
.cover { padding-bottom: 16px; border-bottom: 1px solid #ccc; margin-bottom: 16px; }
.card, .objective, .theme, table, .obj-grid > div, .stat-row, .compare-card {
  break-inside: avoid; page-break-inside: avoid;
}
.card { border: 1px solid #ddd; border-radius: 8px; padding: 14px; margin-bottom: 10px; background: #fff; }
.row { display: flex; flex-wrap: wrap; gap: 24px; }
.stat { min-width: 90px; }
.stat .label { font-size: 7pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #767676; margin-bottom: 2px; }
.stat .val { font-size: 18pt; font-weight: 600; letter-spacing: -0.02em; }
.stat .delta { font-size: 9pt; }
.pos { color: #02614b; font-weight: 600; }
.neg { color: #fc5c40; font-weight: 600; }
.neu { color: #767676; }
.theme { border-left: 3px solid #0a45ce; padding: 4px 0 4px 12px; margin-bottom: 12px; }
.theme.dev { border-left-color: #fc5c40; }
.theme-title { font-weight: 600; margin-bottom: 4px; }
.quote { font-style: italic; color: #666; border-left: 2px solid #ccc; padding-left: 10px; margin: 6px 0; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #ddd; font-size: 9pt; }
th { color: #767676; font-weight: 500; }
.obj-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.obj-grid > div { border: 1px solid #ddd; border-left-width: 4px; border-radius: 6px; padding: 10px; background: #fff; }
.obj-pillar { font-size: 8pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; }
.footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #ccc; font-size: 8pt; color: #767676; text-align: center; }
.wordcloud { display: flex; flex-wrap: wrap; gap: 8px 12px; padding: 8px 0; }
.wordcloud span { font-weight: 600; }
`;
}

function radarSVG(rows, prevRows) {
  const size = 460;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size / 2 - 110;
  const n = rows.length;
  if (!n) return "";
  const pt = (i, value, max) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = (value / max) * r;
    return [cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist];
  };
  const ringPath = (frac) => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      pts.push(`${cx + Math.cos(angle) * r * frac},${cy + Math.sin(angle) * r * frac}`);
    }
    return "M" + pts.join(" L") + " Z";
  };
  const series = (key, color, opacity, dashed = false) => {
    const pts = rows.map((row, i) => pt(i, row[key] || 0, 10));
    const d = "M" + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L") + " Z";
    return `<path d="${d}" fill="${color}" fill-opacity="${opacity}" stroke="${color}" stroke-width="1.5" ${dashed ? 'stroke-dasharray="4 3" fill="none"' : ""} />`;
  };

  const gridRings = [0.25, 0.5, 0.75, 1]
    .map((f) => `<path d="${ringPath(f)}" fill="none" stroke="#ddd" stroke-width="1" />`)
    .join("");

  const splitLabel = (label) => {
    if (label.length <= 14) return [label];
    if (label.includes(" & ")) {
      const [a, b] = label.split(" & ");
      return [a + " &", b];
    }
    const words = label.split(" ");
    if (words.length === 1) return [label];
    const half = Math.ceil(words.length / 2);
    return [words.slice(0, half).join(" "), words.slice(half).join(" ")];
  };

  const labels = rows
    .map((row, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const lx = cx + Math.cos(angle) * (r + 30);
      const ly = cy + Math.sin(angle) * (r + 20);
      const anchor = Math.abs(Math.cos(angle)) < 0.3 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
      const lines = splitLabel(String(row.label));
      const tspans = lines
        .map((line, idx) => `<tspan x="${lx.toFixed(1)}" dy="${idx === 0 ? 0 : 12}">${esc(line)}</tspan>`)
        .join("");
      return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" font-size="10" fill="#434343">${tspans}</text>`;
    })
    .join("");

  const prevSeries = prevRows && prevRows.length ? series("Previous", "#999", 0, true) : "";

  return `
<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" width="100%" style="max-width:480px;display:block;margin:0 auto">
  ${gridRings}
  ${prevSeries}
  ${series("Self", "#434343", 0.12)}
  ${series("Peers", "#02614b", 0.18)}
  ${series("Manager", "#fc5c40", 0.15)}
  ${labels}
  <g transform="translate(8, ${size - 8})" font-size="9" fill="#434343">
    <text>■ Self <tspan dx="6" fill="#02614b">■ Peers</tspan> <tspan dx="6" fill="#fc5c40">■ Manager</tspan>${prevSeries ? ' <tspan dx="6" fill="#999">- - Previous</tspan>' : ""}</text>
  </g>
</svg>`;
}

function valuesBarSVG(rows) {
  const w = 480;
  const h = 220;
  const padL = 40;
  const padB = 30;
  const padT = 10;
  const usableW = w - padL - 12;
  const usableH = h - padT - padB;
  const groupW = usableW / Math.max(1, rows.length);
  const max = 5;
  const colours = { Self: "#434343", Peers: "#02614b", Manager: "#fc5c40" };
  const series = ["Self", "Peers", "Manager"];
  const barW = (groupW - 12) / series.length;

  let bars = "";
  rows.forEach((row, i) => {
    const x0 = padL + i * groupW + 6;
    series.forEach((s, j) => {
      const val = row[s] || 0;
      const bh = (val / max) * usableH;
      const x = x0 + j * barW;
      const y = padT + (usableH - bh);
      bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barW - 2).toFixed(1)}" height="${bh.toFixed(1)}" fill="${colours[s]}"/>`;
    });
  });

  const xLabels = rows
    .map(
      (row, i) =>
        `<text x="${(padL + i * groupW + groupW / 2).toFixed(1)}" y="${(h - 14).toFixed(1)}" text-anchor="middle" font-size="9" fill="#434343">${esc(row.label)}</text>`
    )
    .join("");

  const yTicks = [0, 1, 2, 3, 4, 5]
    .map(
      (v) => `
      <line x1="${padL}" x2="${w - 6}" y1="${(padT + ((max - v) / max) * usableH).toFixed(1)}" y2="${(padT + ((max - v) / max) * usableH).toFixed(1)}" stroke="#eee" />
      <text x="${(padL - 6).toFixed(1)}" y="${(padT + ((max - v) / max) * usableH + 3).toFixed(1)}" text-anchor="end" font-size="8" fill="#999">${v}</text>`
    )
    .join("");

  return `
<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" width="100%" style="max-width:520px;display:block;margin:0 auto">
  ${yTicks}
  ${bars}
  ${xLabels}
  <g transform="translate(${padL}, ${h - 2})" font-size="9">
    <text fill="#434343">■ Self <tspan dx="6" fill="#02614b">■ Peers</tspan> <tspan dx="6" fill="#fc5c40">■ Manager</tspan></text>
  </g>
</svg>`;
}

function renderOverview(data, prevData, results, t) {
  const employee = data.employee;
  const r = data.ratings;
  const pr = prevData?.ratings || {};
  const overview =
    (results?.overviewStatement && String(results.overviewStatement).trim()) ||
    (results?.synthesis?.summary && String(results.synthesis.summary).trim()) ||
    "";

  const compRows = (data.compSummary || []).map((c) => ({
    label: c.label,
    Self: c.selfScore || 0,
    Peers: c.peerAvg || 0,
    Manager: c.managerScore || 0,
    Previous: prevData
      ? ((prevData.compSummary || []).find((p) => p.key === c.key) || {}).peerAvg || 0
      : null,
  }));

  return `
<section class="section">
  <h2>${esc(t("tab.overview"))}</h2>
  ${
    overview
      ? `<div class="card"><h3>${esc(t("overview.statement"))}</h3><p>${esc(overview)}</p></div>`
      : ""
  }
  <div class="card">
    <h3>${esc(t("overview.headline"))}</h3>
    <div class="row">
      <div class="stat"><div class="label">${esc(t("overview.overall"))}</div><div class="val">${r.overall ?? "—"}</div>${prevData ? `<div class="delta">${fmtDelta(pr.overall, r.overall)}</div>` : ""}</div>
      <div class="stat"><div class="label">${esc(t("overview.peerAvg"))}</div><div class="val">${r.peerAvg ?? "—"}</div>${prevData ? `<div class="delta">${fmtDelta(pr.peerAvg, r.peerAvg)}</div>` : ""}</div>
      <div class="stat"><div class="label">${esc(t("overview.self"))}</div><div class="val">${r.self ?? "—"}</div>${prevData ? `<div class="delta">${fmtDelta(pr.self, r.self)}</div>` : ""}</div>
      <div class="stat"><div class="label">${esc(t("overview.manager"))}</div><div class="val">${r.manager ?? "—"}</div>${prevData ? `<div class="delta">${fmtDelta(pr.manager, r.manager)}</div>` : ""}</div>
      <div class="stat"><div class="label">${esc(t("overview.peerCount"))}</div><div class="val">${r.peerCount ?? "—"}</div></div>
    </div>
  </div>
  <div class="card">
    <h3>${esc(t("analysis.title"))}</h3>
    ${radarSVG(compRows, prevData ? compRows : null)}
  </div>
  <div class="card">
    <h3>${esc(t("analysis.breakdown"))}</h3>
    <table>
      <thead><tr><th>${esc(t("analysis.competency"))}</th><th>${esc(t("overview.self"))}</th><th>${esc(t("overview.peerAvg"))}</th><th>${esc(t("overview.manager"))}</th><th>${esc(t("analysis.gaps"))}</th></tr></thead>
      <tbody>
        ${(data.compSummary || [])
          .map(
            (c) => `
          <tr>
            <td><strong>${esc(c.label)}</strong></td>
            <td>${c.selfScore ?? "—"}</td>
            <td>${c.peerAvg ?? "—"}</td>
            <td>${c.managerScore ?? "—"}</td>
            <td class="${c.gaps?.length ? "neg" : "neu"}">${c.gaps?.length ? esc(c.gaps.join(", ")) : "—"}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>
</section>`;
}

function renderValues(data, t) {
  const rows = (data.valSummary || []).map((v) => ({
    label: v.short,
    Self: v.selfScore || 0,
    Peers: v.peerAvg || 0,
    Manager: v.managerScore || 0,
  }));
  return `
<section class="section">
  <h2>${esc(t("tab.values"))}</h2>
  <div class="card">
    <h3>${esc(t("values.title"))}</h3>
    ${valuesBarSVG(rows)}
  </div>
  ${(data.valSummary || [])
    .map(
      (v) => `
    <div class="card">
      <h3>${esc(v.short)}</h3>
      <p class="muted"><em>"${esc(v.full)}"</em></p>
      <div class="row">
        <div class="stat"><div class="label">${esc(t("overview.self"))}</div><div class="val">${v.selfScore ?? "—"}</div></div>
        <div class="stat"><div class="label">${esc(t("overview.peerAvg"))}</div><div class="val pos">${v.peerAvg ?? "—"}</div></div>
        <div class="stat"><div class="label">${esc(t("overview.manager"))}</div><div class="val neg">${v.managerScore ?? "—"}</div></div>
      </div>
    </div>`
    )
    .join("")}
</section>`;
}

function renderSynthesis(results, words, t) {
  const s = results?.synthesis;
  if (!s) return "";
  return `
<section class="section">
  <h2>${esc(t("tab.synthesis"))}</h2>
  ${s.summary ? `<div class="card"><p>${esc(s.summary)}</p></div>` : ""}
  ${
    s.highlightQuote?.text
      ? `<div class="card"><blockquote class="quote">"${esc(s.highlightQuote.text)}"<div class="muted">— ${esc(s.highlightQuote.attribution || "")}</div></blockquote></div>`
      : ""
  }
  ${
    s.strengths?.length
      ? `<div class="card"><h3>${esc(t("synthesis.strengths"))}</h3>${s.strengths
          .map(
            (x) => `
        <div class="theme">
          <div class="theme-title">${esc(x.title || "")}</div>
          <p>${esc(x.body || "")}</p>
          ${x.quote ? `<blockquote class="quote">"${esc(x.quote)}"<div class="muted">— ${esc(x.quoteAttr || "")}</div></blockquote>` : ""}
        </div>`
          )
          .join("")}</div>`
      : ""
  }
  ${
    s.development?.length
      ? `<div class="card"><h3>${esc(t("synthesis.development"))}</h3>${s.development
          .map(
            (x) => `
        <div class="theme dev">
          <div class="theme-title">${esc(x.title || "")}</div>
          <p>${esc(x.body || "")}</p>
          ${x.selfAwareness ? `<p class="muted"><strong>Self-awareness:</strong> ${esc(x.selfAwareness)}</p>` : ""}
          ${x.recommendation ? `<p><strong>Recommendation:</strong> ${esc(x.recommendation)}</p>` : ""}
        </div>`
          )
          .join("")}</div>`
      : ""
  }
  ${s.agreedPriority ? `<div class="card"><h3>${esc(t("synthesis.priority"))}</h3><p>${esc(s.agreedPriority)}</p></div>` : ""}
  ${
    words?.length
      ? `<div class="card"><h3>${esc(t("wordcloud.title"))}</h3><div class="wordcloud">${words
          .map(
            (w) =>
              `<span class="${w.polarity}" style="font-size:${w.size}px">${esc(w.word)}</span>`
          )
          .join("")}</div></div>`
      : ""
  }
</section>`;
}

function renderObjectives(results, t) {
  const o = results?.objectives;
  if (!o?.objectives?.length) return "";
  return `
<section class="section">
  <h2>${esc(t("tab.objectives"))}</h2>
  <div class="obj-grid">
    ${o.objectives
      .map(
        (x) => `
      <div style="border-left-color:${esc(x.color || "#ccc")}">
        <div class="obj-pillar" style="color:${esc(x.color || "#666")}">${esc(x.icon || "")} ${esc(x.pillar || "")}</div>
        <p style="font-weight:600">${esc(x.statement || "")}</p>
        ${x.fastCriteria ? `<p><strong>${esc(t("objectives.fast"))}:</strong> ${esc(x.fastCriteria)}</p>` : ""}
        ${x.rationale ? `<p><strong>${esc(t("objectives.rationale"))}:</strong> ${esc(x.rationale)}</p>` : ""}
        ${x.measure ? `<p><strong>${esc(t("objectives.measure"))}:</strong> ${esc(x.measure)}</p>` : ""}
      </div>`
      )
      .join("")}
  </div>
</section>`;
}

function renderDevelopment(results, t) {
  const d = results?.development;
  if (!d) return "";
  return `
<section class="section">
  <h2>${esc(t("tab.development"))}</h2>
  ${d.coachingFocus ? `<div class="card"><h3>${esc(t("development.coachingFocus"))}</h3><p>${esc(d.coachingFocus)}</p></div>` : ""}
  ${
    d.opportunities?.length
      ? `<div class="card"><h3>${esc(t("development.opportunities"))}</h3>${d.opportunities
          .map(
            (o) => `
        <div class="theme" style="border-left-color:${esc(o.color || "#0a45ce")}">
          <div class="theme-title">${esc(o.type || "")} — ${esc(o.gap || "")}</div>
          <p>${esc(o.description || "")}</p>
        </div>`
          )
          .join("")}</div>`
      : ""
  }
  ${
    d.books?.length
      ? `<div class="card"><h3>${esc(t("development.reading"))}</h3>${d.books
          .map(
            (b) => `
        <p><strong>${esc(b.title || "")}</strong> <span class="muted">— ${esc(b.author || "")}</span><br/>${esc(b.rationale || "")}</p>`
          )
          .join("")}</div>`
      : ""
  }
</section>`;
}

function renderCompare(data, prevData, t) {
  if (!prevData) return "";
  const findPrev = (list, key) => (list || []).find((x) => x.key === key);
  return `
<section class="section">
  <h2>${esc(t("tab.compare"))}</h2>
  <div class="card">
    <h3>${esc(t("compare.ratings"))}</h3>
    <table><thead><tr><th></th><th>${esc(t("compare.previous"))}</th><th>${esc(t("compare.current"))}</th><th>${esc(t("compare.change"))}</th></tr></thead><tbody>
      ${["overall", "peerAvg", "self", "manager"]
        .map(
          (k) => `
        <tr><td><strong>${esc(t("overview." + (k === "peerAvg" ? "peerAvg" : k)))}</strong></td><td>${prevData.ratings?.[k] ?? "—"}</td><td>${data.ratings?.[k] ?? "—"}</td><td>${fmtDelta(prevData.ratings?.[k], data.ratings?.[k])}</td></tr>`
        )
        .join("")}
    </tbody></table>
  </div>
  <div class="card">
    <h3>${esc(t("compare.competencies"))}</h3>
    <table><thead><tr><th>${esc(t("analysis.competency"))}</th><th>${esc(t("compare.previous"))}</th><th>${esc(t("compare.current"))}</th><th>${esc(t("compare.change"))}</th></tr></thead><tbody>
      ${(data.compSummary || [])
        .map((c) => {
          const p = findPrev(prevData.compSummary, c.key);
          return `<tr><td><strong>${esc(c.label)}</strong></td><td>${p?.peerAvg ?? "—"}</td><td>${c.peerAvg ?? "—"}</td><td>${fmtDelta(p?.peerAvg, c.peerAvg)}</td></tr>`;
        })
        .join("")}
    </tbody></table>
  </div>
</section>`;
}

function renderInfo(data, results, conductedBy, t) {
  const counts = {
    strengths: data.openFeedback?.strengths?.length || 0,
    challenges: data.openFeedback?.challenges?.length || 0,
    advice: data.openFeedback?.advice?.length || 0,
    additional: data.openFeedback?.additional?.length || 0,
  };
  return `
<section class="section">
  <h2>${esc(t("tab.info"))}</h2>
  <div class="card">
    <h3>${esc(t("info.feedback"))}</h3>
    <div class="row">
      <div class="stat"><div class="label">${esc(t("info.strengths"))}</div><div class="val">${counts.strengths}</div></div>
      <div class="stat"><div class="label">${esc(t("info.challenges"))}</div><div class="val">${counts.challenges}</div></div>
      <div class="stat"><div class="label">${esc(t("info.advice"))}</div><div class="val">${counts.advice}</div></div>
      <div class="stat"><div class="label">${esc(t("info.additional"))}</div><div class="val">${counts.additional}</div></div>
    </div>
  </div>
  <div class="card">
    <h3>${esc(t("info.timestamps"))}</h3>
    <p>${esc(t("info.dataDate"))}: <strong>${esc(data.dataDate || "—")}</strong></p>
    ${results?.savedAt ? `<p>${esc(t("info.savedAt"))}: <strong>${esc(new Date(results.savedAt).toLocaleString())}</strong></p>` : ""}
    <p>${esc(t("info.lastEdit"))}: <strong>${esc(new Date().toLocaleString())}</strong></p>
    ${conductedBy ? `<p>${esc(t("info.reviewer"))}: <strong>${esc(conductedBy)}</strong></p>` : ""}
  </div>
</section>`;
}

export function buildExportHTML({ data, prevData, results, words, view, lang, t, conductedBy, displayName }) {
  if (!data) return "";
  const e = data.employee || {};
  const name = displayName || e.name || "Appraisal";
  const title = `AIMOS 360 — ${name}`;

  return `<!doctype html>
<html lang="${esc(lang || "en-GB")}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>${styles()}</style>
</head>
<body>
<div class="cover">
  <h1>${esc(name)}</h1>
  <div class="muted">${esc(e.jobTitle || "")}</div>
  <div class="row" style="margin-top:8px;font-size:9pt;color:#666">
    ${e.tenure ? `<span><strong>${esc(t("title.tenure"))}:</strong> ${esc(e.tenure)}</span>` : ""}
    ${e.reportsTo ? `<span><strong>${esc(t("title.reportsTo"))}:</strong> ${esc(e.reportsTo)}</span>` : ""}
    ${data.dataDate ? `<span><strong>${esc(t("title.dataDate"))}:</strong> ${esc(data.dataDate)}</span>` : ""}
  </div>
</div>
${renderOverview(data, prevData, results, t)}
${renderValues(data, t)}
${renderSynthesis(results, words, t)}
${renderObjectives(results, t)}
${renderDevelopment(results, t)}
${renderCompare(data, prevData, t)}
${renderInfo(data, results, conductedBy, t)}
<div class="footer">${esc(t("footer.confidential"))}</div>
</body>
</html>`;
}

export function downloadExport(opts) {
  const html = buildExportHTML(opts);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = (opts.displayName || opts.data?.employee?.name || "appraisee").replace(/\s+/g, "_");
  a.href = url;
  a.download = `AIMOS_360_${safeName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
