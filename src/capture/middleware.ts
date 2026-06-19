import type { Request, Response, NextFunction } from "express";
import { TEST_NAME_HEADER, DEFAULT_SANITIZE } from "./constants";
import { filterHeaders } from "./headers";
import { sanitizeHeaders, sanitizeBody } from "./sanitize";
import type { Collector, SanitizeOptions } from "./types";

/**
 * Create the Express middleware that captures the request/response of any request
 * tagged with the `x-test-name` header. It patches res.json/res.send/res.end so it
 * runs AFTER routing (route template + parsed body available), sanitizes the pair,
 * and records it into the Collector. This is step 1 of the pipeline (capture).
 */
export const createCaptureMiddleware =
  (collector: Collector, sanitize: SanitizeOptions = DEFAULT_SANITIZE) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const testName = req.header(TEST_NAME_HEADER);
    if (!testName) return next();

    // Runs inside the patched response methods, i.e. after routing — so req.route is populated
    // and req.body is parsed. Request and response are captured together (no header round-trip).
    const capture = (body: unknown): void => {
      const route = `${req.baseUrl ?? ""}${req.route?.path ?? req.path}`;
      const reqHeaders = filterHeaders(req.headers as Record<string, unknown>);
      const resHeaders = filterHeaders(res.getHeaders() as Record<string, unknown>);
      collector.record({
        testName,
        method: req.method,
        route,
        request: {
          url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
          method: req.method,
          path: req.path,
          query: sanitizeBody(req.query, undefined, sanitize) as Record<string, unknown>,
          headers: sanitizeHeaders(reqHeaders, sanitize),
          body: sanitizeBody(req.body ?? null, req.get("content-type"), sanitize),
        },
        response: {
          status: res.statusCode,
          headers: sanitizeHeaders(resHeaders, sanitize),
          body: sanitizeBody(body ?? null, res.getHeader("content-type") as string | undefined, sanitize),
        },
      });
    };

    const json = res.json.bind(res);
    res.json = (body: unknown) => {
      capture(body);
      return json(body);
    };

    const send = res.send.bind(res);
    res.send = (body?: unknown) => {
      capture(body);
      return send(body);
    };

    const end = res.end.bind(res) as (...args: unknown[]) => Response;
    res.end = ((...args: unknown[]) => {
      capture(null); // Collector keeps the first record, so a prior json/send body survives
      return end(...args);
    }) as Response["end"];

    next();
  };
