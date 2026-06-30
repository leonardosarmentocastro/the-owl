import type { ReactNode } from "react";
import { Play } from "lucide-react";
import { validateForm } from "../../request/build-request";
import type { RequestFormState } from "../../request/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KeyValueTable } from "./KeyValueTable";
import { PathTable } from "./PathTable";
import { labelClass } from "./constants";

interface Props {
  form: RequestFormState;
  onChange: (next: RequestFormState) => void;
  onFire: () => void;
  firing: boolean;
  /** Rendered between the fields and the "Try it out" button (e.g. the cURL block). */
  children?: ReactNode;
}

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

      <Button type="button" className="mt-2 w-full" disabled={firing || errors.length > 0} onClick={onFire}>
        <Play className="size-3.5" /> {firing ? "Firing…" : "Try it out"}
      </Button>
    </div>
  );
};
