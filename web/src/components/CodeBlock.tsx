import type { ReactNode } from "react";

/** Monospace, boxed block for displaying request/response JSON and headers. */
export const CodeBlock = ({ children }: { children: ReactNode }) => (
  <pre className="my-1.5 overflow-x-auto whitespace-pre rounded-md border bg-muted px-3 py-2.5 font-mono text-xs leading-relaxed">
    {children}
  </pre>
);
