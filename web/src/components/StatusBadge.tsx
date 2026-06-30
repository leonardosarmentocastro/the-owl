import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const StatusBadge = ({ status, statusText }: { status: number; statusText?: string }) => {
  const ok2xx = status >= 200 && status < 300;
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono",
        ok2xx
          ? "border-green-600/30 bg-green-50 text-green-700"
          : "border-red-600/30 bg-red-50 text-red-700",
      )}
    >
      {status}
      {statusText ? ` ${statusText}` : ""}
    </Badge>
  );
};
