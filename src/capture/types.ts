import type { CapturedRequest, CapturedResponse, Endpoint } from "../types";

/** One captured request/response pair as handed to the Collector. */
export interface RecordInput {
  testName: string;
  method: string;
  route: string;
  request: CapturedRequest;
  response: CapturedResponse;
}

/**
 * Holds the Examples captured during one test process and drains them into
 * serialized Endpoints. Filled by the capture middleware (`record`), emptied by
 * the drain domain (`drain`).
 */
export interface Collector {
  record(input: RecordInput): void;
  drain(): Endpoint[];
}

/** Resolved sanitization policy applied to every captured Example before it leaves memory. */
export interface SanitizeOptions {
  /** Header names (lowercased) whose values are masked but kept. */
  redactHeaders: Set<string>;
  /** Object keys (normalized) whose values are masked anywhere in a body/query. */
  redactKeys: Set<string>;
  /** Max serialized body size before truncation. */
  maxBodyBytes: number;
}

/** Public overrides accepted by `connect()` for the redaction / body-safety defaults. */
export interface ConnectOptions {
  redactHeaders?: Iterable<string>;
  redactKeys?: Iterable<string>;
  maxBodyBytes?: number;
}
