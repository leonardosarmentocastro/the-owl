import { useState } from "react";
import type { Example } from "../api";
import { isLive } from "../live";
import { prefillFromExample } from "../request/prefill";
import { fireRequest, type LiveResult } from "../request/fire";
import type { RequestFormState } from "../request/types";
import { RequestForm } from "./RequestForm";
import { ResponsePanel } from "./ResponsePanel";
import { CodeBlock } from "./CodeBlock";

export const ExampleAccordion = ({
  method, route, example,
}: { method: string; route: string; example: Example }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RequestFormState | null>(null);
  const [result, setResult] = useState<LiveResult | null>(null);
  const [firing, setFiring] = useState(false);
  const live = isLive();

  const toggle = () => {
    if (!open && live && !form) setForm(prefillFromExample(example, route));
    setOpen(!open);
  };

  const fire = async () => {
    if (!form) return;
    setFiring(true);
    setResult(await fireRequest(form));
    setFiring(false);
  };

  const ok2xx = example.response.status >= 200 && example.response.status < 300;
  return (
    <div style={{ borderTop: "1px solid #eee" }}>
      <div onClick={toggle} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 4px", cursor: "pointer" }}>
        <span style={{ opacity: 0.5, width: 12 }}>{open ? "▾" : "▸"}</span>
        <span
          style={{
            fontFamily: "monospace", fontWeight: 700, fontSize: 11, padding: "1px 8px", borderRadius: 20,
            background: ok2xx ? "#dcfce7" : "#fee2e2", color: ok2xx ? "#15803d" : "#b91c1c",
          }}
        >
          {example.response.status}
        </span>
        <span>{example.name}</span>
      </div>

      {open && (
        <div style={{ padding: "4px 4px 14px 36px" }}>
          {live && form ? (
            <>
              <RequestForm form={form} onChange={setForm} onFire={fire} firing={firing} />
              {result && <ResponsePanel result={result} />}
            </>
          ) : (
            <>
              <h4>Request</h4>
              <CodeBlock>{JSON.stringify(example.request.body ?? {}, null, 2)}</CodeBlock>
              <h4>Response</h4>
              <CodeBlock>{JSON.stringify(example.response.body ?? {}, null, 2)}</CodeBlock>
            </>
          )}
        </div>
      )}
    </div>
  );
};
