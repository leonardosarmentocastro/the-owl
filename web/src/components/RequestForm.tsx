import type { ReactNode } from "react";
import { Play, Trash2 } from "lucide-react";
import { validateForm } from "../request/build-request";
import type { KeyValue, RequestFormState } from "../request/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  form: RequestFormState;
  onChange: (next: RequestFormState) => void;
  onFire: () => void;
  firing: boolean;
  /** Rendered between the fields and the "Try it out" button (e.g. the cURL block). */
  children?: ReactNode;
}

const labelClass = "mt-2 block text-[11px] uppercase tracking-wide text-muted-foreground";
const cellInputClass =
  "h-8 w-full bg-transparent px-2 font-mono text-xs outline-none placeholder:text-muted-foreground/50 focus:bg-muted/60";

const blankRow = (): KeyValue => ({ name: "", value: "" });
const isEmptyRow = (r: KeyValue): boolean => r.name === "" && r.value === "";

/** Drop trailing empty rows so state holds at most the real entries; the editor
 * re-appends a single draft row on render (Bruno-style key/value editing). */
const stripTrailingEmpty = (rows: KeyValue[]): KeyValue[] => {
  const out = [...rows];
  while (out.length > 0 && isEmptyRow(out[out.length - 1])) out.pop();
  return out;
};

const TableHead = () => (
  <thead>
    <tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
      <th className="w-2/5 border-b border-r px-2 py-1 text-left font-normal">Name</th>
      <th className="border-b px-2 py-1 text-left font-normal">Value</th>
      <th className="w-8 border-b border-l" aria-hidden="true" />
    </tr>
  </thead>
);

/** Editable key/value table for query / headers: typing a name in the trailing
 * draft row appends a new draft; clearing a row back to empty collapses it. */
const KeyValueTable = ({
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
      <table aria-label={title} className="mt-1 w-full table-fixed border-collapse overflow-hidden rounded-md border text-xs">
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
  );
};

/** Read-only-name table for path params: values are editable, but rows are fixed
 * (the route template defines them), so there is no add or remove. */
const PathTable = ({
  rows, onRows,
}: { rows: KeyValue[]; onRows: (rows: KeyValue[]) => void }) => (
  <div>
    <Label className={labelClass}>Path</Label>
    <table aria-label="Path" className="mt-1 w-full table-fixed border-collapse overflow-hidden rounded-md border text-xs">
      <TableHead />
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
            <td className="border-l align-middle" aria-hidden="true" />
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const RequestForm = ({ form, onChange, onFire, firing, children }: Props) => {
  const errors = validateForm(form);
  const bodyless = form.method === "GET" || form.method === "HEAD";

  return (
    <div className="flex flex-col gap-1">
      {form.pathParams.length > 0 && (
        <PathTable rows={form.pathParams} onRows={(pathParams) => onChange({ ...form, pathParams })} />
      )}

      <KeyValueTable title="Query" rows={form.query} onRows={(query) => onChange({ ...form, query })} />
      <KeyValueTable title="Headers" rows={form.headers} onRows={(headers) => onChange({ ...form, headers })} />

      {!bodyless && (
        <div>
          <Label className={labelClass}>Body</Label>
          <Textarea
            className="min-h-20 w-full font-mono text-xs"
            value={form.body}
            onChange={(e) => onChange({ ...form, body: e.target.value })}
          />
        </div>
      )}

      {errors.map((e) => (
        <small key={e} className="text-amber-600">{e}</small>
      ))}

      {children}

      <Button type="button" className="mt-2 self-start" disabled={firing || errors.length > 0} onClick={onFire}>
        <Play className="size-3.5" /> {firing ? "Firing…" : "Try it out"}
      </Button>
    </div>
  );
};
