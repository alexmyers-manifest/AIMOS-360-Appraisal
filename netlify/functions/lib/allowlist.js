import { getStore } from "@netlify/blobs";

const STORE_NAME = "aimos-allowlist";
const KEY = "emails";

const SEED = [
  "alex@manifest.group",
  "anna@manifest.group",
  "kellie@manifest.group",
  "jessica@manifest.group",
  "emmas@manifest.group",
  "emmac@manifest.group",
  "isabel@manifest.group",
  "laurenp@manifest.group",
  "laurenk@manifest.group",
  "danni@manifest.group",
];

function store() {
  return getStore(STORE_NAME);
}

export async function readAllowlist() {
  const s = store();
  const raw = await s.get(KEY, { type: "json" });
  if (!raw) {
    await s.setJSON(KEY, SEED);
    return [...SEED];
  }
  return Array.isArray(raw) ? raw : [];
}

export async function writeAllowlist(list) {
  const s = store();
  const cleaned = Array.from(new Set(list.map((e) => e.toLowerCase()))).sort();
  await s.setJSON(KEY, cleaned);
  return cleaned;
}

export async function isAllowed(email) {
  const list = await readAllowlist();
  return list.includes(String(email).toLowerCase());
}
