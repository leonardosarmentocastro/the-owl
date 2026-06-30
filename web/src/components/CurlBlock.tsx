import { useState } from "react";
import type { RequestFormState } from "../request/types";
import { formatCurl } from "../request/curl";
import { CodeBlock } from "./CodeBlock";

/** Shows a copy-pasteable curl command for a request form, in both docs modes. */
export const CurlBlock = ({ form, baseUrl }: { form: RequestFormState; baseUrl: string }) => {
  const [copied, setCopied] = useState(false);
  const command = formatCurl(form, baseUrl);

  const copy = () => {
    navigator.clipboard.writeText(command).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", opacity: 0.7 }}>cURL</span>
        <button type="button" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
      </div>
      <CodeBlock>{command}</CodeBlock>
    </div>
  );
};
