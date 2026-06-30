import type { Endpoint } from "../../api";
import { SidebarEndpoint } from "./SidebarEndpoint";

/** The docs navigation tree: one collapsible group per endpoint. */
export const Sidebar = ({ endpoints, activeHash, onNavigate }: {
  endpoints: Endpoint[]; activeHash: string; onNavigate?: () => void;
}) => (
  <nav aria-label="API endpoints">
    <ul className="m-0 p-0">
      {endpoints.map((endpoint) => (
        <SidebarEndpoint
          key={`${endpoint.method} ${endpoint.route}`}
          endpoint={endpoint}
          activeHash={activeHash}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  </nav>
);
