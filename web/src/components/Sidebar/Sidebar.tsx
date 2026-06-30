import type { Endpoint } from "../../api";
import { groupEndpoints } from "../../nav/group-endpoints";
import { SidebarGroup } from "./SidebarGroup";

/** The docs navigation tree: one section per resource group, each holding its
 * collapsible endpoints. */
export const Sidebar = ({ endpoints, activeHash, onNavigate }: {
  endpoints: Endpoint[]; activeHash: string; onNavigate?: () => void;
}) => (
  <nav aria-label="API endpoints">
    <ul className="m-0 p-0">
      {groupEndpoints(endpoints).map((group) => (
        <SidebarGroup
          key={group.name}
          group={group}
          activeHash={activeHash}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  </nav>
);
