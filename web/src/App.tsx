import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { loadCatalog, type Catalog, DEFAULT_DOCS_HOST } from "./api";
import { isLive } from "./live";
import { EndpointCard } from "./components/EndpointCard";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { useHash } from "./nav/use-hash";
import { useMediaQuery } from "./nav/use-media-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const App = () => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeHash = useHash();
  const isNarrow = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    loadCatalog().then(setCatalog).catch((e: unknown) => setError(String(e)));
  }, []);

  if (error) return <pre className="p-4 text-red-600">{error}</pre>;
  if (!catalog) return <p className="p-6">Loading…</p>;

  const baseUrl = isLive() ? window.location.origin : (catalog.baseUrl ?? DEFAULT_DOCS_HOST);

  const sidebar = (
    <Sidebar endpoints={catalog.endpoints} activeHash={activeHash} onNavigate={() => setDrawerOpen(false)} />
  );

  const generatedAt = new Date(catalog.generatedAt).toLocaleString();

  const content = (
    <main className="box-border min-w-0 max-w-[1400px] flex-1 p-3 sm:p-6">
      {!isNarrow && (
        <>
          <h1 className="text-2xl font-bold">API docs</h1>
          <small className="text-muted-foreground">Generated {generatedAt}</small>
        </>
      )}
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
      <div>
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background px-4 py-2.5">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] overflow-y-auto p-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>
          <div className="flex min-w-0 items-baseline gap-2">
            <strong>API docs</strong>
            <small className="truncate text-muted-foreground">Generated {generatedAt}</small>
          </div>
        </header>
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-start">
      <aside className="sticky top-0 box-border h-screen w-[280px] shrink-0 overflow-y-auto border-r p-4">
        {sidebar}
      </aside>
      {content}
    </div>
  );
};
