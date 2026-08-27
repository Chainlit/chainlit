const shadowHosts: HTMLElement[] = [];

/**
 * Mounts a real (open) shadow root and points window.cl_shadowRootElement at a
 * div inside it, mirroring how the Copilot widget mounts. Returns the shadow
 * root so tests can assert popovers are portaled into the encapsulated tree.
 * Cleanup is handled globally by setup-tests' afterEach — no per-spec wiring needed.
 */
export function mountShadowHost(): ShadowRoot {
  const host = document.createElement('div');
  document.body.appendChild(host);
  shadowHosts.push(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const container = document.createElement('div');
  shadowRoot.appendChild(container);
  window.cl_shadowRootElement = container as HTMLDivElement;

  return shadowRoot;
}

/** Removes any mounted shadow hosts and clears the global. Run once from setup-tests' afterEach. */
export function cleanupShadowHosts(): void {
  shadowHosts.forEach((host) => host.remove());
  shadowHosts.length = 0;
  window.cl_shadowRootElement = undefined;
}
