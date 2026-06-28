import type { LiveResult } from "../request/fire";

const prettify = (text: string): string => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

export const ResponsePanel = ({ result }: { result: LiveResult }) => {
  if (result.error) {
    return (
      <div style={{ marginTop: 10, border: "1px solid crimson", borderRadius: 6, padding: 10, color: "crimson" }}>
        <strong>Request failed:</strong> {result.error}
      </div>
    );
  }

  const ok2xx = result.status >= 200 && result.status < 300;
  return (
    <div style={{ marginTop: 10, borderTop: "1px dashed #ccc", paddingTop: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span
          style={{
            fontFamily: "monospace", fontWeight: 700, padding: "1px 8px", borderRadius: 20,
            background: ok2xx ? "#dcfce7" : "#fee2e2", color: ok2xx ? "#15803d" : "#b91c1c",
          }}
        >
          {result.status} {result.statusText}
        </span>
        <small style={{ opacity: 0.7 }}>{result.timeMs} ms · {result.sizeBytes} B</small>
      </div>
      <h4>Body</h4>
      <pre>{prettify(result.bodyText)}</pre>
      <details>
        <summary>Response headers ({Object.keys(result.headers).length})</summary>
        <pre>{Object.entries(result.headers).map(([k, v]) => `${k}: ${v}`).join("\n")}</pre>
      </details>
    </div>
  );
};
