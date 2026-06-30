import { useEffect, useState } from "react";
import { loadCatalog, type Catalog, DEFAULT_DOCS_HOST } from "./api";
import { isLive } from "./live";
import { EndpointCard } from "./components/EndpointCard";
import { Sidebar } from "./components/Sidebar";
import { useHash } from "./nav/use-hash";
import { useMediaQuery } from "./nav/use-media-query";

export const App = () => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeHash = useHash();
  const isNarrow = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    loadCatalog().then(setCatalog).catch((e: unknown) => setError(String(e)));
  }, []);

  if (error) return <pre style={{ color: "crimson" }}>{error}</pre>;
  if (!catalog) return <p>Loading…</p>;

  const baseUrl = isLive() ? window.location.origin : (catalog.baseUrl ?? DEFAULT_DOCS_HOST);

  const sidebar = (
    <Sidebar endpoints={catalog.endpoints} activeHash={activeHash} onNavigate={() => setDrawerOpen(false)} />
  );

  const content = (
    <main style={{ flex: 1, maxWidth: 900, padding: 24, boxSizing: "border-box" }}>
      <h1>API docs</h1>
      <small>Generated {new Date(catalog.generatedAt).toLocaleString()}</small>
      {catalog.endpoints.map((endpoint) => (
        <EndpointCard
          key={`${endpoint.method} ${endpoint.route}`}
          endpoint={endpoint}
          baseUrl={baseUrl}
          activeHash={activeHash}
        />
      ))}
    </main>
  );

  if (isNarrow) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #eee", position: "sticky", top: 0, background: "#fff", zIndex: 20 }}>
          <button onClick={() => setDrawerOpen(true)} aria-label="Open navigation" style={{ fontSize: 20, lineHeight: 1, background: "none", border: "none", cursor: "pointer" }}>☰</button>
          <strong>API docs</strong>
        </header>
        {drawerOpen && (
          <>
            <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 30 }} />
            <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 280, background: "#fff", overflowY: "auto", zIndex: 40, padding: 16, boxSizing: "border-box", boxShadow: "2px 0 8px rgba(0,0,0,0.15)" }}>
              {sidebar}
            </div>
          </>
        )}
        {content}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", fontFamily: "system-ui, sans-serif" }}>
      <aside style={{ position: "sticky", top: 0, height: "100vh", overflowY: "auto", width: 280, flexShrink: 0, borderRight: "1px solid #eee", padding: 16, boxSizing: "border-box" }}>
        {sidebar}
      </aside>
      {content}
    </div>
  );
};
