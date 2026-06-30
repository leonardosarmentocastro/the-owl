import type { Endpoint } from "../api";
import { ExampleAccordion } from "./ExampleAccordion";

export const EndpointCard = ({ endpoint, baseUrl }: { endpoint: Endpoint; baseUrl: string }) => (
  <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 16 }}>
    <h2 style={{ fontFamily: "monospace" }}>
      <span style={{ color: "#067" }}>{endpoint.method}</span> {endpoint.route}
    </h2>
    {endpoint.examples.map((example) => (
      <ExampleAccordion
        key={example.name}
        method={endpoint.method}
        route={endpoint.route}
        example={example}
        baseUrl={baseUrl}
      />
    ))}
  </section>
);
