import cloneDeep from 'lodash/cloneDeep';
import { useEffect, useRef, useState } from 'react';

/** Snapshot of committed settings when `isOpen` becomes true (for Reset / cancel). */
export function useChatSettingsValuesAtOpen(
  isOpen: boolean,
  chatSettingsValue: Record<string, unknown>
): Record<string, unknown> {
  const [valuesAtOpen, setValuesAtOpen] = useState<Record<string, unknown>>(
    {}
  );
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!wasOpenRef.current) {
        setValuesAtOpen(cloneDeep(chatSettingsValue));
      }
      wasOpenRef.current = true;
    } else {
      wasOpenRef.current = false;
    }
  }, [isOpen, chatSettingsValue]);

  return valuesAtOpen;
}
