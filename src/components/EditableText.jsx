import { useEffect, useRef, useState } from "react";

export default function EditableText({
  value,
  onSave,
  multiline = false,
  rows = 3,
  placeholder = "Click to edit",
  readOnly = false,
  style = {},
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const ref = useRef(null);

  useEffect(() => setDraft(value || ""), [value]);
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select?.();
    }
  }, [editing]);

  if (readOnly) {
    return (
      <span style={style}>
        {value || <span style={{ color: "var(--g-400)", fontStyle: "italic" }}>—</span>}
      </span>
    );
  }

  if (editing) {
    const shared = {
      ref,
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onBlur: () => {
        setEditing(false);
        if (draft !== value) onSave(draft);
      },
      onKeyDown: (e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          e.target.blur();
        }
        if (e.key === "Escape") {
          setDraft(value || "");
          setEditing(false);
        }
      },
      style: {
        ...style,
        width: "100%",
        fontFamily: "inherit",
        border: "1px solid var(--blue)",
        borderRadius: 4,
        padding: "6px 8px",
        outline: "none",
        background: "#f0f4ff",
        resize: multiline ? "vertical" : "none",
      },
    };
    return multiline ? <textarea rows={rows} {...shared} /> : <input type="text" {...shared} />;
  }

  return (
    <span
      onClick={() => setEditing(true)}
      style={{
        ...style,
        cursor: "pointer",
        borderBottom: "1px dashed var(--g-300)",
        display: multiline ? "block" : "inline",
      }}
      title="Click to edit"
    >
      {value || <span style={{ color: "var(--g-400)", fontStyle: "italic" }}>{placeholder}</span>}
    </span>
  );
}
