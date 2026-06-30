import { Trash2 } from "lucide-react";
import type { KeyValue } from "../../request/types";
import { cn } from "@/lib/shadcn/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TableHead } from "./TableHead";
import { cellInputClass, labelClass } from "./constants";

const blankRow = (): KeyValue => ({ name: "", value: "" });
const isEmptyRow = (r: KeyValue): boolean => r.name === "" && r.value === "";

/** Drop trailing empty rows so state holds at most the real entries; the editor
 * re-appends a single draft row on render (Bruno-style key/value editing). */
const stripTrailingEmpty = (rows: KeyValue[]): KeyValue[] => {
  const out = [...rows];
  while (out.length > 0 && isEmptyRow(out[out.length - 1])) out.pop();
  return out;
};

/** Editable key/value table for query / headers: typing a name in the trailing
 * draft row appends a new draft; clearing a row back to empty collapses it. */
export const KeyValueTable = ({
  title, rows, onRows,
}: { title: string; rows: KeyValue[]; onRows: (rows: KeyValue[]) => void }) => {
  const display = [...rows, blankRow()];
  const draftIndex = display.length - 1;
  const setRow = (i: number, patch: Partial<KeyValue>) =>
    onRows(stripTrailingEmpty(display.map((r, j) => (j === i ? { ...r, ...patch } : r))));
  const removeRow = (i: number) =>
    onRows(stripTrailingEmpty(display.filter((_, j) => j !== i)));

  return (
    <div>
      <Label className={labelClass}>{title}</Label>
      <div className="mt-1 overflow-x-auto">
      <table aria-label={title} className="w-full table-fixed border-collapse overflow-hidden rounded-md border text-xs">
        <TableHead />
        <tbody>
          {display.map((row, i) => {
            const needsInput = !!row.needsInput && row.value.trim() === "";
            return (
              <tr key={i} className="border-b last:border-b-0">
                <td className="border-r p-0 align-middle">
                  <input
                    className={cellInputClass}
                    placeholder="name"
                    value={row.name}
                    onChange={(e) => setRow(i, { name: e.target.value })}
                  />
                </td>
                <td className="p-0 align-middle">
                  <input
                    className={cn(cellInputClass, needsInput && "bg-amber-50 text-amber-900 placeholder:text-amber-600/70")}
                    placeholder={row.needsInput ? "was redacted — enter a value" : "value"}
                    value={row.value}
                    onChange={(e) => setRow(i, { value: e.target.value })}
                  />
                </td>
                <td className="border-l p-0 text-center align-middle">
                  {i !== draftIndex && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove"
                      className="size-8 rounded-none text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(i)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
};
