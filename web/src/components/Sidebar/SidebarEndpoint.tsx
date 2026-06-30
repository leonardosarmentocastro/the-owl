import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Endpoint } from "../../api";
import { exampleSlug } from "../../nav/slug";
import { cn } from "@/lib/shadcn/utils";
import { methodColorClass, statusColorClass } from "../../theme/http-color-mapper";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/** One collapsible endpoint in the sidebar: a method+route toggle over the
 * endpoint's example links. */
export const SidebarEndpoint = ({ endpoint, activeHash, onNavigate }: {
  endpoint: Endpoint; activeHash: string; onNavigate?: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="list-none">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left font-mono text-[13px] hover:bg-muted">
          <span><span className={cn("font-bold", methodColorClass(endpoint.method))}>{endpoint.method}</span> {endpoint.route}</span>
          {expanded
            ? <ChevronDown className="size-3.5 opacity-50" />
            : <ChevronRight className="size-3.5 opacity-50" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="m-0 p-0">
            {endpoint.examples.map((example) => {
              const slug = exampleSlug(endpoint.method, endpoint.route, example.name);
              const active = slug === activeHash;
              return (
                <li key={example.name} className="list-none">
                  <a
                    href={`#${slug}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => onNavigate?.()}
                    className={cn(
                      "block cursor-pointer rounded-md py-1.5 pl-[22px] pr-2 text-[13px] no-underline",
                      active ? "bg-accent font-semibold text-primary" : "text-foreground/80",
                    )}
                  >
                    <span className={cn("font-mono text-[11px] font-bold", statusColorClass(example.response.status))}>{example.response.status}</span>{" "}
                    {example.name}
                  </a>
                </li>
              );
            })}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
};
