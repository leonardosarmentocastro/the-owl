import { useEffect, useState } from "react";
import { loadCatalog, type Catalog, DEFAULT_DOCS_HOST } from "./api";
import { isLive } from "./live";
import { EndpointCard } from "./components/EndpointCard";

export const App = () => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadCatalog().then(setCatalog).catch((e: unknown) => setError(String(e)));
  }, []);

  if (error) return <pre style={{ color: "crimson" }}>{error}</pre>;
  if (!catalog) return <p>Loading…</p>;

  const baseUrl = isLive() ? window.location.origin : (catalog.baseUrl ?? DEFAULT_DOCS_HOST);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>API docs</h1>
      <small>Generated {new Date(catalog.generatedAt).toLocaleString()}</small>
      {catalog.endpoints.map((endpoint) => (
        <EndpointCard key={`${endpoint.method} ${endpoint.route}`} endpoint={endpoint} baseUrl={baseUrl} />
      ))}
    </main>
  );
};
