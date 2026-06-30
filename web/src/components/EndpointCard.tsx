import type { Endpoint } from "../api";
import { ExampleAccordion } from "./ExampleAccordion";
import { MethodBadge } from "./MethodBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EndpointCard = ({ endpoint, baseUrl, activeHash }: { endpoint: Endpoint; baseUrl: string; activeHash?: string }) => (
  <Card className="mt-4">
    <CardHeader>
      <CardTitle className="font-mono text-lg">
        <MethodBadge method={endpoint.method} /> {endpoint.route}
      </CardTitle>
    </CardHeader>
    <CardContent>
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
