/** Tracks whether an hx-auto-wrapup message has been sent and the triggered turn is still inflight. */
let _wrapupInflight = false;

/** Mark that a wrapup message has been sent and a new turn is inflight. */
export function setWrapupInflight(): void { _wrapupInflight = true; }

/** Clear the inflight flag — called when the triggered turn completes or the unit ends. */
export function clearWrapupInflight(): void { _wrapupInflight = false; }

/** Returns true if a wrapup message has been sent and the turn is still inflight. */
export function isWrapupInflight(): boolean { return _wrapupInflight; }

/** Reset guard state — called at session start and session switch. */
export function resetWrapupGuard(): void { _wrapupInflight = false; }
