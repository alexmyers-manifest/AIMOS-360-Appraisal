import { useMemo } from "react";
import { buildWordCloud } from "../lib/wordcloud.js";

export default function WordCloud({ openFeedback, lang, t, employeeName }) {
  const words = useMemo(
    () => buildWordCloud(openFeedback, lang, 40, employeeName),
    [openFeedback, lang, employeeName]
  );
  if (!words.length) return null;

  const isEnglish = lang === "en-GB" || lang === "en-US" || lang === "en-AU";

  return (
    <div className="card">
      <div className="section-h" style={{ marginTop: 0 }}>{t("wordcloud.title")}</div>
      <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>
        {isEnglish ? t("wordcloud.legendEn") : t("wordcloud.legendOther")}
      </p>
      <div className="wordcloud">
        {words.map((w) => (
          <span
            key={w.word}
            className={w.polarity === "pos" ? "pos" : w.polarity === "neg" ? "neg" : "neu"}
            style={{ fontSize: w.size }}
            title={`${w.count} mention${w.count === 1 ? "" : "s"}`}
          >
            {w.word}
          </span>
        ))}
      </div>
    </div>
  );
}
