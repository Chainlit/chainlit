import { useSyncExternalStore } from 'react';

export const useWidthCalc = () => {
  const width = useSyncExternalStore(
    (listener) => {
      window.addEventListener('resize', listener);

      return () => {
        window.removeEventListener('resize', listener);
      };
    },
    () => window.innerWidth
  );

  return width;
};
