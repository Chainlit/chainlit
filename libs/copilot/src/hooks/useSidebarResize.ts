import { useCallback, useEffect, useRef, useState } from 'react';

import { DisplayMode } from '../types';

const SIDEBAR_MIN_WIDTH = 300;
const SIDEBAR_DEFAULT_WIDTH = 400;
const SIDEBAR_MAX_WIDTH_RATIO = 0.5;
const LS_WIDTH_KEY = 'chainlit-copilot-sidebarWidth';

interface UseSidebarResizeOptions {
  displayMode: DisplayMode;
  isOpen: boolean;
}

interface UseSidebarResizeReturn {
  sidebarWidth: number;
  handleMouseDown: () => void;
}

export function useSidebarResize({
  displayMode,
  isOpen
}: UseSidebarResizeOptions): UseSidebarResizeReturn {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem(LS_WIDTH_KEY);
    return stored ? Number(stored) : SIDEBAR_DEFAULT_WIDTH;
  });
  const isDragging = useRef(false);
  const originalMarginRef = useRef('');

  useEffect(() => {
    if (displayMode === 'sidebar') {
      localStorage.setItem(LS_WIDTH_KEY, String(sidebarWidth));
    }
  }, [sidebarWidth, displayMode]);

  const stopDragging = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.userSelect = '';
    document.body.style.transition = 'margin-right 0.3s ease-in-out';
  }, []);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.transition = '';
  }, []);

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

  useEffect(() => {
    if (displayMode === 'sidebar' && isOpen) {
      originalMarginRef.current = document.body.style.marginRight;
      document.body.style.transition = 'margin-right 0.3s ease-in-out';
      return () => {
        document.body.style.marginRight = originalMarginRef.current;
        document.body.style.transition = '';
      };
    }
  }, [displayMode, isOpen]);

  useEffect(() => {
    if (displayMode === 'sidebar' && isOpen) {
      document.body.style.marginRight = `${sidebarWidth}px`;
    }
  }, [sidebarWidth, displayMode, isOpen]);

  return { sidebarWidth, handleMouseDown };
}
