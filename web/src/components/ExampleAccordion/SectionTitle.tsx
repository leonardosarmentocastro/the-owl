import type { ReactNode } from "react";

/** Small underlined heading for the Request / Response columns. */
export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h4 className="mb-2 border-b pb-1 text-sm font-semibold">{children}</h4>
);
