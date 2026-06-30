import { Play, Plus, X } from "lucide-react";
import { validateForm } from "../request/build-request";
import type { KeyValue, RequestFormState } from "../request/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  form: RequestFormState;
  onChange: (next: RequestFormState) => void;
  onFire: () => void;
  firing: boolean;
}

const labelClass = "mt-2 block text-[11px] uppercase tracking-wide text-muted-foreground";

const KeyValueRows = ({
  title, rows, onRows,
}: { title: string; rows: KeyValue[]; onRows: (rows: KeyValue[]) => void }) => (
  <div>
    <Label className={labelClass}>{title}</Label>
    {rows.map((row, i) => (
      <div key={i} className="mt-1 flex gap-1.5">
        <Input
          className="font-mono text-xs"
          placeholder="name"
          value={row.name}
          onChange={(e) => onRows(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
        />
        <Input
          className={cn("flex-1 font-mono text-xs", row.needsInput && row.value.trim() === "" && "border-amber-500")}
          placeholder={row.needsInput ? "was redacted — enter a value" : "value"}
          value={row.value}
          onChange={(e) => onRows(rows.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
        />
        <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => onRows(rows.filter((_, j) => j !== i))}>
          <X className="size-4" />
        </Button>
      </div>
    ))}
    <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => onRows([...rows, { name: "", value: "" }])}>
      <Plus className="size-3.5" /> add
    </Button>
  </div>
);

export const RequestForm = ({ form, onChange, onFire, firing }: Props) => {
  const errors = validateForm(form);
  const bodyless = form.method === "GET" || form.method === "HEAD";

  return (
    <div className="flex flex-col gap-1">
      {form.pathParams.length > 0 && (
        <div>
          <Label className={labelClass}>Path</Label>
          {form.pathParams.map((p, i) => (
            <div key={p.name} className="mt-1 flex items-center gap-1.5">
              <code className="font-mono text-xs">{p.name}</code>
              <Input
                className="flex-1 font-mono text-xs"
                value={p.value}
                onChange={(e) =>
                  onChange({ ...form, pathParams: form.pathParams.map((q, j) => (j === i ? { ...q, value: e.target.value } : q)) })
                }
              />
            </div>
          ))}
        </div>
      )}

      <KeyValueRows title="Query" rows={form.query} onRows={(query) => onChange({ ...form, query })} />
      <KeyValueRows title="Headers" rows={form.headers} onRows={(headers) => onChange({ ...form, headers })} />

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

      <Button type="button" className="mt-2 self-start" disabled={firing || errors.length > 0} onClick={onFire}>
        <Play className="size-3.5" /> {firing ? "Firing…" : "Try it out"}
      </Button>
    </div>
  );
};
