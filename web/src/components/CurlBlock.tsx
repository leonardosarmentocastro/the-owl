import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { RequestFormState } from "../request/types";
import { formatCurl } from "../request/curl";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "./CodeBlock";

/** Shows a copy-pasteable curl command for a request form, in both docs modes. */
export const CurlBlock = ({ form, baseUrl }: { form: RequestFormState; baseUrl: string }) => {
  const [copied, setCopied] = useState(false);
  const command = formatCurl(form, baseUrl);

  const copy = () => {
    navigator.clipboard.writeText(command).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  };

  return (
    <div className="mt-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">cURL</span>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <CodeBlock>{command}</CodeBlock>
    </div>
  );
};
