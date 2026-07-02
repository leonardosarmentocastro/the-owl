import type { Endpoint } from "../../api";
import { groupEndpoints } from "../../nav/group-endpoints";
import { SidebarGroup } from "./SidebarGroup";
import logoUrl from "../../assets/the-owl-lockup.svg";

const REPO_URL = "https://github.com/leonardosarmentocastro/the-owl";

/** The docs navigation tree: the branded logo over one section per resource
 * group, each holding its collapsible endpoints. `grouping` is the
 * THE_OWL_GROUPING_REGEX source baked onto the Catalog at build time. */
export const Sidebar = ({ endpoints, activeHash, onNavigate, grouping }: {
  endpoints: Endpoint[]; activeHash: string; onNavigate?: () => void; grouping?: string;
}) => (
  <nav aria-label="API endpoints">
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-4 mx-auto block w-fit"
    >
      <img src={logoUrl} alt="the-owl" className="h-[90px] w-auto" />
    </a>
    <ul className="m-0 p-0">
      {groupEndpoints(endpoints, grouping).map((group) => (
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
