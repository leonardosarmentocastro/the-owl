/** Name / Value (+ optional action) header shared by the request field tables. */
export const TableHead = ({ actions = true }: { actions?: boolean }) => (
  <thead>
    <tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
      <th className="w-2/5 border-b border-r px-2 py-1 text-left font-normal">Name</th>
      <th className="border-b px-2 py-1 text-left font-normal">Value</th>
      {actions && <th className="w-8 border-b border-l" aria-hidden="true" />}
    </tr>
  </thead>
);
