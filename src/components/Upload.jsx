import { useRef, useState } from "react";
import { parseFiles } from "../lib/parseHibob.js";
import AppraisalHistory from "./AppraisalHistory.jsx";

function DropTarget({ accept = ".xlsx,.xls,.csv", busy, label, sub, onFiles }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);
  return (
    <div
      className={"dropzone" + (drag ? " dragover" : "")}
      onClick={() => ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onFiles(e.dataTransfer.files);
      }}
      style={{ padding: "32px 24px" }}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple
        style={{ display: "none" }}
        onChange={(e) => onFiles(e.target.files)}
      />
      {busy ? (
        <div>
          <span className="spinner" />Parsing…
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 15, marginBottom: 4 }}>{label}</div>
          <div className="muted" style={{ fontSize: 13 }}>{sub}</div>
        </div>
      )}
    </div>
  );
}

export default function Upload({ onParsed, onPrevParsed, prevData, onClearPrev, history, onLoadHistory, onDeleteHistory, t }) {
  const [busy, setBusy] = useState(false);
  const [busyPrev, setBusyPrev] = useState(false);
  const [error, setError] = useState(null);
  const [errorPrev, setErrorPrev] = useState(null);

  async function handleFiles(fileList, isPrev) {
    const setB = isPrev ? setBusyPrev : setBusy;
    const setE = isPrev ? setErrorPrev : setError;
    setE(null);
    const files = Array.from(fileList || []).filter((f) => f.name.match(/\.(xlsx?|csv)$/i));
    if (!files.length) {
      setE(t("upload.error.format"));
      return;
    }
    setB(true);
    try {
      const data = await parseFiles(files);
      if (isPrev) onPrevParsed(data);
      else onParsed(data);
    } catch (e) {
      setE(e.message);
    } finally {
      setB(false);
    }
  }

  return (
    <div>
      <DropTarget
        busy={busy}
        label={t("upload.title")}
        sub={t("upload.subtitle")}
        onFiles={(f) => handleFiles(f, false)}
      />
      {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}

      <div style={{ marginTop: 16 }}>
        <div className="section-h" style={{ marginTop: 0 }}>
          {t("upload.prev.title")} <span className="muted" style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· {t("common.optional")}</span>
        </div>
        <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{t("upload.prev.sub")}</div>
        {prevData ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              border: "1px solid var(--green)",
              borderRadius: 6,
              background: "#f4fdf9",
            }}
          >
            <div style={{ flex: 1 }}>
              <strong>{t("upload.prev.added")}</strong>
              <div className="muted" style={{ fontSize: 12 }}>
                {prevData.employee?.name} · {prevData.dataDate || "—"}
              </div>
            </div>
            <button className="btn btn-secondary" onClick={onClearPrev}>{t("upload.prev.clear")}</button>
          </div>
        ) : (
          <DropTarget
            busy={busyPrev}
            label={t("upload.prev.title")}
            sub=".xlsx / .csv"
            onFiles={(f) => handleFiles(f, true)}
          />
        )}
        {errorPrev && <p className="error" style={{ marginTop: 12 }}>{errorPrev}</p>}
      </div>

      <AppraisalHistory
        history={history}
        onLoad={onLoadHistory}
        onDelete={onDeleteHistory}
        t={t}
      />
    </div>
  );
}
