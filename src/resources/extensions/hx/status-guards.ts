/**
 * Status predicates for HX state-machine guards.
 *
 * The DB stores status as free-form strings. Two values indicate
 * "closed": "complete" (canonical) and "done" (legacy / alias).
 * Every inline `status === "complete" || status === "done"` should
 * use isClosedStatus() instead.
 */

/** Returns true when a milestone, slice, or task status indicates closure. */
export function isClosedStatus(status: string): boolean {
  return status === "complete" || status === "done";
}

/** Returns true when a slice status indicates it was explicitly deferred. */
export function isDeferredStatus(status: string): boolean {
  return status === "deferred";
}

/**
 * Returns true when a milestone/slice/task status is "inactive" — either
 * closed (complete/done) or explicitly deferred. Inactive units should not
 * be re-dispatched.
 */
export function isInactiveStatus(status: string): boolean {
  return isClosedStatus(status) || isDeferredStatus(status);
}
