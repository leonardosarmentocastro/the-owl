import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const MethodBadge = ({ method, className }: { method: string; className?: string }) => (
  <Badge variant="secondary" className={cn("font-mono text-primary", className)}>
    {method}
  </Badge>
);
