import cloneDeep from 'lodash/cloneDeep';
import { useEffect, useRef, useState } from 'react';

export interface ChatSettingsSnapshotAtOpen {
  valuesAtOpen: Record<string, unknown>;
  inputsAtOpen: unknown[];
}

/** Snapshots values + input schema when `isOpen` becomes true (Reset / cancel). */
export function useChatSettingsSnapshotAtOpen(
  isOpen: boolean,
  chatSettingsValue: Record<string, unknown>,
  chatSettingsInputs: unknown[]
): ChatSettingsSnapshotAtOpen {
  const [snapshot, setSnapshot] = useState<ChatSettingsSnapshotAtOpen>({
    valuesAtOpen: {},
    inputsAtOpen: []
  });
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!wasOpenRef.current) {
        setSnapshot({
          valuesAtOpen: cloneDeep(chatSettingsValue),
          inputsAtOpen: cloneDeep(chatSettingsInputs)
        });
      }
      wasOpenRef.current = true;
    } else {
      wasOpenRef.current = false;
    }
  }, [isOpen, chatSettingsValue, chatSettingsInputs]);

  return snapshot;
}
