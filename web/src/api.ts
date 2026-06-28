export interface Example {
  name: string;
  request: { url: string; method: string; path: string; query: Record<string, unknown>; headers: Record<string, string>; body: unknown };
  response: { status: number; headers: Record<string, string>; body: unknown };
}
export interface Endpoint { method: string; route: string; examples: Example[] }
export interface Catalog { generatedAt: string; endpoints: Endpoint[] }

export const loadCatalog = async (): Promise<Catalog> => {
  const res = await fetch("./catalog.json");
  if (!res.ok) throw new Error("catalog.json not found — run `the-owl build`");
  return res.json() as Promise<Catalog>;
};
