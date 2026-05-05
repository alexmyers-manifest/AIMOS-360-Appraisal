const NS = "aimos";
const MAX_HISTORY = 20;

function hashEmail(email) {
  return String(email || "anon").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
}

function key(email, suffix) {
  return `${NS}.${hashEmail(email)}.${suffix}`;
}

function read(email, suffix, fallback = null) {
  try {
    const raw = localStorage.getItem(key(email, suffix));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(email, suffix, value) {
  try {
    localStorage.setItem(key(email, suffix), JSON.stringify(value));
  } catch (err) {
    console.error("[aimos storage]", err);
  }
}

function historyKey(employeeName, dataDate) {
  const name = (employeeName || "unknown").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
  let monthYear = "unknown";
  if (dataDate) {
    const d = new Date(dataDate);
    if (!isNaN(d.getTime())) {
      monthYear = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    } else {
      const parts = String(dataDate).match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
      if (parts) {
        const yr = parts[3].length === 2 ? "20" + parts[3] : parts[3];
        monthYear = yr + "-" + String(parts[1]).padStart(2, "0");
      }
    }
  }
  return name + ":" + monthYear;
}

export function loadSession(email) {
  return read(email, "session", null);
}

export function saveSession(email, payload) {
  write(email, "session", payload);
}

export function clearSession(email) {
  try {
    localStorage.removeItem(key(email, "session"));
  } catch {}
}

export function loadHistory(email) {
  const raw = read(email, "history", []);
  return Array.isArray(raw) ? raw : [];
}

export function saveToHistory(email, entry) {
  const list = loadHistory(email);
  const hk = historyKey(entry.employeeName, entry.dataDate);
  const existing = list.find((h) => h.hk === hk);
  const record = {
    hk,
    employeeName: entry.employeeName,
    jobTitle: entry.jobTitle,
    dataDate: entry.dataDate,
    savedAt: existing?.savedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: entry.data,
    prevData: entry.prevData || null,
    synthesis: entry.synthesis,
    objectives: entry.objectives,
    development: entry.development,
    overviewStatement: entry.overviewStatement || "",
    displayName: entry.displayName || "",
  };
  const idx = list.findIndex((h) => h.hk === hk);
  if (idx >= 0) list[idx] = record;
  else list.unshift(record);
  list.sort((a, b) => new Date(b.updatedAt || b.savedAt) - new Date(a.updatedAt || a.savedAt));
  const trimmed = list.slice(0, MAX_HISTORY);
  write(email, "history", trimmed);
  return trimmed;
}

export function deleteFromHistory(email, hk) {
  const list = loadHistory(email).filter((h) => h.hk !== hk);
  write(email, "history", list);
  return list;
}
