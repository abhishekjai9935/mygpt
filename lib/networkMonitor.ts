/**
 * Counts outgoing fetch/XMLHttpRequest calls made by this page, without
 * ever reading or storing what's inside them (no URLs, bodies, or
 * responses — just a tally). Used by the Local Privacy Check panel to give
 * a live, verifiable number rather than a hardcoded claim.
 *
 * Scope note: this only sees requests initiated by JavaScript running on
 * this page. It cannot see Chrome's own internal model download traffic,
 * other browser-level requests, or anything from other tabs/extensions —
 * that's exactly what the panel's disclaimer says.
 */
export function installNetworkMonitor(onRequest: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const originalFetch = window.fetch;
  const originalOpen = XMLHttpRequest.prototype.open;

  window.fetch = function patchedFetch(...args: Parameters<typeof fetch>) {
    onRequest();
    return originalFetch.apply(this, args);
  };

  // XMLHttpRequest.open has overloaded signatures; typing the wrapper against
  // one overload doesn't satisfy assignment to the full overloaded type, so
  // this casts at the boundary instead of narrowing the parameter types.
  XMLHttpRequest.prototype.open = function patchedOpen(
    this: XMLHttpRequest,
    ...args: unknown[]
  ) {
    onRequest();
    return (originalOpen as (...a: unknown[]) => void).apply(this, args);
  } as typeof XMLHttpRequest.prototype.open;

  return () => {
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalOpen;
  };
}
