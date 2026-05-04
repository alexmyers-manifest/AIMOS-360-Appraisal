import { useRef, useState } from "react";
import { parseFiles } from "../lib/parseHibob.js";

export default function Upload({ onParsed }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  async function handle(fileList) {
    setError(null);
    const files = Array.from(fileList || []).filter((f) => f.name.match(/\.(xlsx?|csv)$/i));
    if (!files.length) {
      setError("Upload .xlsx or .csv files exported from HiBob.");
      return;
    }
    setBusy(true);
    try {
      const data = await parseFiles(files);
      onParsed(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        className={"dropzone" + (drag ? " dragover" : "")}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handle(e.target.files)}
        />
        {busy ? (
          <div>
            <span className="spinner" />Parsing…
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 16, marginBottom: 4 }}>Drop a HiBob 360° export here</div>
            <div className="muted" style={{ fontSize: 13 }}>
              .xlsx or .csv — managers, peers and self sheets
            </div>
          </div>
        )}
      </div>
      {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}
    </div>
  );
}
