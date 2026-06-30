import type { Endpoint } from "../api";
import { ExampleAccordion } from "./ExampleAccordion";
import { MethodBadge } from "./MethodBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EndpointCard = ({ endpoint, baseUrl, activeHash }: { endpoint: Endpoint; baseUrl: string; activeHash?: string }) => (
  <Card className="mt-4 gap-3 py-4 sm:gap-6 sm:py-6">
    <CardHeader className="px-3 sm:px-6">
      <CardTitle className="font-mono text-lg">
        <MethodBadge method={endpoint.method} /> {endpoint.route}
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
