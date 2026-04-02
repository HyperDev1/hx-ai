/**
 * HX Error Types — Typed error hierarchy for diagnostics and crash recovery.
 *
 * All HX-specific errors extend HXError, which carries a stable `code`
 * string suitable for programmatic matching. Error codes are defined as
 * constants so callers can switch on them without string-matching.
 */

// ─── Error Codes ──────────────────────────────────────────────────────────────

export const HX_STALE_STATE = "HX_STALE_STATE";
export const HX_LOCK_HELD = "HX_LOCK_HELD";
export const HX_ARTIFACT_MISSING = "HX_ARTIFACT_MISSING";
export const HX_GIT_ERROR = "HX_GIT_ERROR";
export const HX_MERGE_CONFLICT = "HX_MERGE_CONFLICT";
export const HX_PARSE_ERROR = "HX_PARSE_ERROR";
export const HX_IO_ERROR = "HX_IO_ERROR";

// ─── Base Error ───────────────────────────────────────────────────────────────

export class HXError extends Error {
  readonly code: string;

  constructor(code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "HXError";
    this.code = code;
  }
}
