import type { Endpoint } from "../api";
import { ExampleAccordion } from "./ExampleAccordion";
import { cn } from "@/lib/utils";
import { methodColorClass } from "../http-style";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EndpointCard = ({ endpoint, baseUrl, activeHash }: { endpoint: Endpoint; baseUrl: string; activeHash?: string }) => (
  <Card className="mt-4 gap-3 py-4 sm:gap-6 sm:py-6">
    <CardHeader className="px-3 sm:px-6">
      <CardTitle className="font-mono text-lg">
        <span className={cn("font-bold", methodColorClass(endpoint.method))}>{endpoint.method}</span> {endpoint.route}
      </CardTitle>
    </CardHeader>
    <CardContent className="px-3 sm:px-6">
      {endpoint.examples.map((example) => (
        <ExampleAccordion
          key={example.name}
          method={endpoint.method}
          route={endpoint.route}
          example={example}
          baseUrl={baseUrl}
          activeHash={activeHash}
        />
      ))}
    </CardContent>
  </Card>
);
