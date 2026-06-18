import type { Endpoint } from "../api";

export const EndpointCard = ({ endpoint }: { endpoint: Endpoint }) => (
  <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 16 }}>
    <h2 style={{ fontFamily: "monospace" }}>
      <span style={{ color: "#067" }}>{endpoint.method}</span> {endpoint.route}
    </h2>
    {endpoint.examples.map((example) => (
      <details key={example.name} style={{ marginTop: 8 }}>
        <summary>
          {example.name} — <code>{example.response.status}</code>
        </summary>
        <h4>Request</h4>
        <pre>{JSON.stringify(example.request.body ?? {}, null, 2)}</pre>
        <h4>Response</h4>
        <pre>{JSON.stringify(example.response.body ?? {}, null, 2)}</pre>
      </details>
    ))}
  </section>
);
