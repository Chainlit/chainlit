import { useCallback, useEffect, useRef, useState } from 'react';

import { DisplayMode } from '../types';

const SIDEBAR_MIN_WIDTH = 300;
const SIDEBAR_DEFAULT_WIDTH = 400;
const SIDEBAR_MAX_WIDTH_RATIO = 0.5;
const LS_WIDTH_KEY = 'chainlit-copilot-sidebarWidth';

interface UseSidebarResizeOptions {
  displayMode: DisplayMode;
  isOpen: boolean;
  hostRoot?: string;
}

interface UseSidebarResizeReturn {
  sidebarWidth: number;
  handleMouseDown: () => void;
}

export function useSidebarResize({
  displayMode,
  isOpen,
  hostRoot
}: UseSidebarResizeOptions): UseSidebarResizeReturn {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem(LS_WIDTH_KEY);
    return stored ? Number(stored) : SIDEBAR_DEFAULT_WIDTH;
  });
  const isDragging = useRef(false);

  // Resolve the host root fresh on each use so a host that swaps the node (SPA re-render)
  // is always handled — never a cached, detached node.
  const getHostRoot = useCallback(
    () => (hostRoot ? document.querySelector<HTMLElement>(hostRoot) : null),
    [hostRoot]
  );

  // Original inline styles of every host node we've constrained this session. The SPA can
  // swap the host mid-session, so we key by node and restore them all on close.
  const styledHosts = useRef(
    new Map<
      HTMLElement,
      { width: string; overflowX: string; transition: string }
    >()
  );

  // Whether we wrote the body-margin fallback this session (host absent). Tracked apart
  // from styledHosts because a session can use both if a configured host disappears.
  const usedBodyFallback = useRef(false);

  // Snapshot a host's original inline styles the first time we touch it, so close can
  // restore it even after a swap.
  const rememberHost = useCallback((host: HTMLElement) => {
    if (!styledHosts.current.has(host)) {
      styledHosts.current.set(host, {
        width: host.style.width,
        overflowX: host.style.overflowX,
        transition: host.style.transition
      });
    }
  }, []);

  // Reserve space beside the sidebar: constrain the host root's width, or (default) push
  // the body with a right margin.
  const reserveSpace = useCallback(
    (width: number) => {
      const host = getHostRoot();
      if (host) {
        rememberHost(host);
        host.style.width = `calc(100vw - ${width}px)`;
      } else {
        usedBodyFallback.current = true;
        document.body.style.marginRight = `${width}px`;
      }
    },
    [getHostRoot, rememberHost]
  );

  // Toggle the reservation transition on whichever element we actually resize, so drags
  // follow the pointer instantly instead of animating each step.
  const setReserveTransition = useCallback(
    (enabled: boolean) => {
      const host = getHostRoot();
      if (host) {
        rememberHost(host);
        host.style.transition = enabled ? 'width 0.3s ease-in-out' : '';
      } else {
        usedBodyFallback.current = true;
        document.body.style.transition = enabled
          ? 'margin-right 0.3s ease-in-out'
          : '';
      }
    },
    [getHostRoot, rememberHost]
  );

  useEffect(() => {
    if (displayMode === 'sidebar') {
      localStorage.setItem(LS_WIDTH_KEY, String(sidebarWidth));
    }
  }, [sidebarWidth, displayMode]);

  const stopDragging = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.userSelect = '';
    setReserveTransition(true);
  }, [setReserveTransition]);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.userSelect = 'none';
    setReserveTransition(false);
  }, [setReserveTransition]);

  useEffect(() => {
    if (displayMode !== 'sidebar' || !isOpen) return;

    function onMouseMove(e: MouseEvent): void {
      if (!isDragging.current) return;
      const maxWidth = window.innerWidth * SIDEBAR_MAX_WIDTH_RATIO;
      const newWidth = Math.min(
        maxWidth,
        Math.max(SIDEBAR_MIN_WIDTH, window.innerWidth - e.clientX)
      );
      setSidebarWidth(newWidth);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', stopDragging);
    window.addEventListener('blur', stopDragging);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('blur', stopDragging);
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.userSelect = '';
      }
    };
  }, [stopDragging, displayMode, isOpen]);

  // Suspend any containing block the host set on <body> (transform / perspective /
  // will-change) so the fixed sidebar stays anchored to the viewport, then reserve space
  // for it. A viewport-filling host (100vw / absolute inset) can't be shrunk by a body
  // margin, so when `hostRoot` is given we constrain that element's width instead.
  // Everything is restored on close.
  useEffect(() => {
    if (displayMode !== 'sidebar' || !isOpen) return;

    const body = document.body;
    const host = getHostRoot();
    usedBodyFallback.current = false;

    const prevBody = {
      transform: body.style.transform,
      perspective: body.style.perspective,
      willChange: body.style.willChange,
      marginRight: body.style.marginRight,
      transition: body.style.transition
    };
    body.style.transform = 'none';
    body.style.perspective = 'none';
    body.style.willChange = 'auto';

    if (host) {
      rememberHost(host);
      // `clip` shrinks non-reflowing content without turning the host into a scroll container.
      host.style.overflowX = 'clip';
    }
    // Reserve first (instant), then enable the transition so only later drags animate.
    reserveSpace(sidebarWidth);
    // Commit the host width before enabling its transition, else Chromium tries to animate
    // width from `auto`, sticks at the pre-open value, and the host never shrinks. A body
    // margin animates from 0 fine, so it needs no flush.
    if (host) void host.offsetWidth;
    setReserveTransition(true);

    const hosts = styledHosts.current;
    return () => {
      body.style.transform = prevBody.transform;
      body.style.perspective = prevBody.perspective;
      body.style.willChange = prevBody.willChange;
      // Restore every host node we constrained — the SPA may have swapped it mid-session.
      hosts.forEach((prev, node) => {
        node.style.width = prev.width;
        node.style.overflowX = prev.overflowX;
        node.style.transition = prev.transition;
      });
      hosts.clear();
      // Undo the body-margin fallback only if we actually used it (a host may have vanished
      // mid-session), so we never clobber host-app updates in the pure-host path.
      if (usedBodyFallback.current) {
        body.style.marginRight = prevBody.marginRight;
        body.style.transition = prevBody.transition;
      }
    };
  }, [
    displayMode,
    isOpen,
    getHostRoot,
    reserveSpace,
    setReserveTransition,
    rememberHost
  ]);

  useEffect(() => {
    if (displayMode !== 'sidebar' || !isOpen) return;
    reserveSpace(sidebarWidth);
  }, [sidebarWidth, displayMode, isOpen, reserveSpace]);

  return { sidebarWidth, handleMouseDown };
}
