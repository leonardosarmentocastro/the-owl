import type { RequestFormState } from "../request/types";
import { formatCurl } from "../request/curl";
import { CodeBlock } from "./CodeBlock";
import { CopyButton } from "./CopyButton";

/** Shows a copy-pasteable curl command for a request form, in both docs modes. */
export const CurlBlock = ({ form, baseUrl }: { form: RequestFormState; baseUrl: string }) => {
  const command = formatCurl(form, baseUrl);

  return (
    <div className="mt-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">cURL</span>
        <CopyButton text={command} />
      </div>
      <CodeBlock>{command}</CodeBlock>
    </div>
  );
};
