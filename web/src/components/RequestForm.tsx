import { validateForm } from "../request/build-request";
import type { KeyValue, RequestFormState } from "../request/types";

interface Props {
  form: RequestFormState;
  onChange: (next: RequestFormState) => void;
  onFire: () => void;
  firing: boolean;
}

const label: React.CSSProperties = {
  display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", opacity: 0.7, marginTop: 8,
};
const input: React.CSSProperties = { fontFamily: "monospace", fontSize: 12, padding: "5px 8px" };

const KeyValueRows = ({
  title, rows, onRows,
}: { title: string; rows: KeyValue[]; onRows: (rows: KeyValue[]) => void }) => (
  <div>
    <span style={label}>{title}</span>
    {rows.map((row, i) => (
      <div key={i} style={{ display: "flex", gap: 6, marginTop: 4 }}>
        <input
          style={input} placeholder="name" value={row.name}
          onChange={(e) => onRows(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
        />
        <input
          style={{ ...input, flex: 1, border: row.needsInput && row.value.trim() === "" ? "1px solid #f59e0b" : undefined }}
          placeholder={row.needsInput ? "was redacted — enter a value" : "value"} value={row.value}
          onChange={(e) => onRows(rows.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
        />
        <button type="button" onClick={() => onRows(rows.filter((_, j) => j !== i))}>×</button>
      </div>
    ))}
    <button type="button" style={{ marginTop: 4 }} onClick={() => onRows([...rows, { name: "", value: "" }])}>
      + add
    </button>
  </div>
);

export const RequestForm = ({ form, onChange, onFire, firing }: Props) => {
  const errors = validateForm(form);
  const bodyless = form.method === "GET" || form.method === "HEAD";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {form.pathParams.length > 0 && (
        <div>
          <span style={label}>Path</span>
          {form.pathParams.map((p, i) => (
            <div key={p.name} style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
              <code>{p.name}</code>
              <input
                style={{ ...input, flex: 1 }} value={p.value}
                onChange={(e) =>
                  onChange({ ...form, pathParams: form.pathParams.map((q, j) => (j === i ? { ...q, value: e.target.value } : q)) })
                }
              />
            </div>
          ))}
        </div>
      )}

      <KeyValueRows title="Query" rows={form.query} onRows={(query) => onChange({ ...form, query })} />
      <KeyValueRows title="Headers" rows={form.headers} onRows={(headers) => onChange({ ...form, headers })} />

      {!bodyless && (
        <div>
          <span style={label}>Body</span>
          <textarea
            style={{ ...input, width: "100%", minHeight: 80, boxSizing: "border-box" }}
            value={form.body} onChange={(e) => onChange({ ...form, body: e.target.value })}
          />
        </div>
      )}

      {errors.map((e) => (
        <small key={e} style={{ color: "#b45309" }}>{e}</small>
      ))}

      <button
        type="button" style={{ alignSelf: "flex-start", marginTop: 8, padding: "7px 16px" }}
        disabled={firing || errors.length > 0} onClick={onFire}
      >
        {firing ? "Firing…" : "Try it out ▶"}
      </button>
    </div>
  );
};
