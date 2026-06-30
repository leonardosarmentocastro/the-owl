import { useState } from "react";
import type { Endpoint } from "../api";
import { exampleSlug } from "../nav/slug";

const SidebarGroup = ({ endpoint, activeHash, onNavigate }: {
  endpoint: Endpoint; activeHash: string; onNavigate?: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <li style={{ listStyle: "none" }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
          gap: 8, padding: "7px 8px", background: "none", border: "none", cursor: "pointer",
          fontFamily: "monospace", fontSize: 13, textAlign: "left", color: "inherit",
        }}
      >
        <span><span style={{ color: "#067" }}>{endpoint.method}</span> {endpoint.route}</span>
        <span style={{ opacity: 0.5 }}>{expanded ? "▾" : "▸"}</span>
      </button>
      {expanded && (
        <ul style={{ margin: 0, padding: 0 }}>
          {endpoint.examples.map((example) => {
            const slug = exampleSlug(endpoint.method, endpoint.route, example.name);
            const active = slug === activeHash;
            return (
              <li key={example.name} style={{ listStyle: "none" }}>
                <a
                  href={`#${slug}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onNavigate?.()}
                  style={{
                    display: "block", padding: "5px 8px 5px 22px", fontSize: 13, textDecoration: "none",
                    color: active ? "#067" : "#333", background: active ? "#eef6f8" : "transparent",
                    fontWeight: active ? 600 : 400, borderRadius: 6,
                  }}
                >
                  <span style={{ fontFamily: "monospace", fontSize: 11, opacity: 0.7 }}>{example.response.status}</span>{" "}
                  {example.name}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
};

export const Sidebar = ({ endpoints, activeHash, onNavigate }: {
  endpoints: Endpoint[]; activeHash: string; onNavigate?: () => void;
}) => (
  <nav aria-label="API endpoints">
    <ul style={{ margin: 0, padding: 0 }}>
      {endpoints.map((endpoint) => (
        <SidebarGroup
          key={`${endpoint.method} ${endpoint.route}`}
          endpoint={endpoint}
          activeHash={activeHash}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  </nav>
);
