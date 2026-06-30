import { AlertCircle } from "lucide-react";
import type { LiveResult } from "../request/fire";
import { CodeBlock } from "./CodeBlock";
import { StatusBadge } from "./StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const prettify = (text: string): string => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

export const ResponsePanel = ({ result }: { result: LiveResult }) => {
  if (result.error) {
    return (
      <Alert variant="destructive" className="mt-2.5">
        <AlertCircle className="size-4" />
        <AlertTitle>Request failed</AlertTitle>
        <AlertDescription>{result.error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-2.5 border-t border-dashed pt-2.5">
      <div className="flex items-center gap-2.5">
        <StatusBadge status={result.status} statusText={result.statusText} />
        <small className="text-muted-foreground">{result.timeMs} ms · {result.sizeBytes} B</small>
      </div>
      <h4>Body</h4>
      <CodeBlock>{prettify(result.bodyText)}</CodeBlock>
      <Collapsible>
        <CollapsibleTrigger className="text-sm text-muted-foreground">
          Response headers ({Object.keys(result.headers).length})
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CodeBlock>{Object.entries(result.headers).map(([k, v]) => `${k}: ${v}`).join("\n")}</CodeBlock>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
