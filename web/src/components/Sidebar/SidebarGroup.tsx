import type { ResourceGroup } from "../../nav/group-endpoints";
import { SidebarEndpoint } from "./SidebarEndpoint";

/** One resource group in the sidebar: a section header (the resource name) over
 * its endpoints. */
export const SidebarGroup = ({ group, activeHash, onNavigate }: {
  group: ResourceGroup; activeHash: string; onNavigate?: () => void;
}) => (
  <li className="list-none">
    <h2 className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {group.name}
    </h2>
    <ul className="m-0 p-0">
      {group.endpoints.map((endpoint) => (
        <SidebarEndpoint
          key={`${endpoint.method} ${endpoint.route}`}
          endpoint={endpoint}
          activeHash={activeHash}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  </li>
);
