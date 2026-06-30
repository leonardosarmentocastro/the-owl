import { cn } from "@/lib/utils";
import { statusColorClass } from "../http-style";

const REASON_PHRASES: Record<number, string> = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  415: "Unsupported Media Type",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

/** "200 OK", "404 NOT FOUND" — always pairs the code with its (uppercased) reason
 * phrase, preferring the standard phrase over a server-supplied `statusText`. */
export const statusLabel = (status: number, statusText?: string): string => {
  const phrase = REASON_PHRASES[status] ?? statusText ?? "";
  return phrase ? `${status} ${phrase.toUpperCase()}` : String(status);
};

export const StatusText = ({
  status, statusText, className,
}: { status: number; statusText?: string; className?: string }) => (
  <span className={cn("font-mono font-bold", statusColorClass(status), className)}>
    {statusLabel(status, statusText)}
  </span>
);
