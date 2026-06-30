import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Example } from "../api";
import { isLive } from "../live";
import { exampleSlug } from "../nav/slug";
import { prefillFromExample } from "../request/prefill";
import { fireRequest, type LiveResult } from "../request/fire";
import type { RequestFormState } from "../request/types";
import { RequestForm } from "./RequestForm";
import { ResponsePanel, type ResponseData } from "./ResponsePanel";
import { CodeBlock } from "./CodeBlock";
import { CurlBlock } from "./CurlBlock";
import { StatusBadge } from "./StatusBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h4 className="mb-2 border-b pb-1 text-sm font-semibold">{children}</h4>
);

/** Normalize a captured Example response into the shape ResponsePanel renders, so
 * the response is shown on first render (no "Try it out" interaction required). */
const capturedResponse = (example: Example): ResponseData => {
  const { body } = example.response;
  const bodyText =
    body == null ? "" : typeof body === "string" ? body : JSON.stringify(body, null, 2);
  return { status: example.response.status, headers: example.response.headers, bodyText };
};

export const ExampleAccordion = ({
  method, route, example, baseUrl, activeHash,
}: { method: string; route: string; example: Example; baseUrl: string; activeHash?: string }) => {
  const slug = exampleSlug(method, route, example.name);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RequestFormState | null>(null);
  const [result, setResult] = useState<LiveResult | null>(null);
  const [firing, setFiring] = useState(false);
  const live = isLive();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeHash && activeHash === slug) {
      setOpen(true);
      ref.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [activeHash, slug]);

  const onOpenChange = (next: boolean) => {
    if (next && live && !form) setForm(prefillFromExample(example, route));
    if (next) window.location.hash = slug;
    else if (window.location.hash === `#${slug}`) window.location.hash = "";
    setOpen(next);
  };

  const fire = async () => {
    if (!form) return;
    setFiring(true);
    setResult(await fireRequest(form));
    setFiring(false);
  };

  return (
    <div id={slug} ref={ref} className="scroll-mt-4 border-t">
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger className="flex w-full items-center gap-2.5 px-1 py-2.5 text-left">
          {open
            ? <ChevronDown className="size-3.5 text-muted-foreground" />
            : <ChevronRight className="size-3.5 text-muted-foreground" />}
          <StatusBadge status={example.response.status} />
          <span>{example.name}</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-1 pb-3.5 pl-9">
          <div className="grid items-start gap-x-6 gap-y-4 lg:grid-cols-2">
            <section>
              <SectionTitle>Request</SectionTitle>
              {live && form ? (
                <RequestForm form={form} onChange={setForm} onFire={fire} firing={firing}>
                  <CurlBlock form={form} baseUrl={baseUrl} />
                </RequestForm>
              ) : (
                <>
                  <CodeBlock>{JSON.stringify(example.request.body ?? {}, null, 2)}</CodeBlock>
                  <CurlBlock form={prefillFromExample(example, route)} baseUrl={baseUrl} />
                </>
              )}
            </section>

            <section>
              <SectionTitle>Response</SectionTitle>
              <ResponsePanel result={result ?? capturedResponse(example)} />
            </section>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
