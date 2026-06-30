import { AlertCircle } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { CopyButton } from "./CopyButton";
import { StatusText } from "./StatusText";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/** A response to render — either a captured Example response or a live fetch
 * result. `timeMs`/`sizeBytes` are present only for live results. */
export interface ResponseData {
  status: number;
  statusText?: string;
  headers: Record<string, string>;
  bodyText: string;
  timeMs?: number;
  sizeBytes?: number;
  error?: string;
}

const prettify = (text: string): string => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

export const ResponsePanel = ({ result }: { result: ResponseData }) => {
  if (result.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Request failed</AlertTitle>
        <AlertDescription>{result.error}</AlertDescription>
      </Alert>
    );
  }

  const body = prettify(result.bodyText);
  const headers = Object.entries(result.headers);

  return (
    <div className="flex flex-col gap-2">
      <div>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Metadata</span>
        <div className="mt-1 flex items-center gap-2.5">
          <StatusText status={result.status} statusText={result.statusText} />
          {result.timeMs != null && (
            <small className="text-muted-foreground">{result.timeMs} ms · {result.sizeBytes} B</small>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Body</span>
          <CopyButton text={body} />
        </div>
        <CodeBlock>{body}</CodeBlock>
      </div>

      {headers.length > 0 && (
        <div>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Headers</span>
          <table aria-label="Response headers" className="mt-1 w-full table-fixed border-collapse overflow-hidden rounded-md border text-xs">
            <thead>
              <tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="w-2/5 border-b border-r px-2 py-1 text-left font-normal">Name</th>
                <th className="border-b px-2 py-1 text-left font-normal">Value</th>
              </tr>
            </thead>
            <tbody>
              {headers.map(([name, value], i) => (
                <tr key={name} className={i % 2 === 1 ? "bg-muted" : "bg-background"}>
                  <td className="border-r px-2 py-1 align-top font-mono text-muted-foreground">{name}</td>
                  <td className="break-all px-2 py-1 align-top font-mono">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
