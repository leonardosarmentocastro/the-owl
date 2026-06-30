/** One editable header / query / path-param row. `needsInput` marks a value that
 * was redacted at capture time and must be supplied before the request can fire. */
export interface KeyValue {
  name: string;
  value: string;
  needsInput?: boolean;
}

/** Editable state backing a single "Try it out" form. */
export interface RequestFormState {
  method: string;
  route: string;
  pathParams: KeyValue[];
  query: KeyValue[];
  headers: KeyValue[];
  body: string;
}
