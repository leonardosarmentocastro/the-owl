import type { ReactNode } from "react";

/** Monospace, boxed block for displaying request/response JSON and headers. */
export const CodeBlock = ({ children }: { children: ReactNode }) => (
  <pre
    style={{
      margin: "6px 0",
      padding: "10px 12px",
      background: "#f6f8fa",
      border: "1px solid #e1e4e8",
      borderRadius: 6,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 12.5,
      lineHeight: 1.5,
      overflowX: "auto",
      whiteSpace: "pre",
    }}
  >
    {children}
  </pre>
);
