import type { KeyValue } from "../../request/types";
import { Label } from "@/components/ui/label";
import { TableHead } from "./TableHead";
import { cellInputClass, labelClass } from "./constants";

/** Read-only-name table for path params: values are editable, but rows are fixed
 * (the route template defines them), so there is no add or remove. */
export const PathTable = ({
  rows, onRows,
}: { rows: KeyValue[]; onRows: (rows: KeyValue[]) => void }) => (
  <div>
    <Label className={labelClass}>Path</Label>
    <div className="mt-1 overflow-x-auto">
    <table aria-label="Path" className="w-full table-fixed border-collapse overflow-hidden rounded-md border text-xs">
      <TableHead actions={false} />
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.name} className="border-b last:border-b-0">
            <td className="border-r align-middle">
              <span className="block px-2 py-1.5 font-mono text-xs text-muted-foreground">{row.name}</span>
            </td>
            <td className="p-0 align-middle">
              <input
                className={cellInputClass}
                placeholder="value"
                value={row.value}
                onChange={(e) => onRows(rows.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  </div>
);
