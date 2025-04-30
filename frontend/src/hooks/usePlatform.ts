import { useMemo } from 'react';

const MOBILE_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

type PlatformPayload = {
  isSSR: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  isMac: boolean;
};

export const usePlatform = (): PlatformPayload => {
  const platforms = useMemo(() => {
    if (navigator == null) {
      return {
        isSSR: true,
        isMobile: false,
        isDesktop: false,
        isMac: false
      };
    }
    const isMobile = navigator.userAgent.match(MOBILE_REGEX) != null;
    const isMac = navigator.userAgent.toUpperCase().match(/MAC/) != null;

    return {
      isSSR: false,
      isMobile,
      isDesktop: !isMobile,
      isMac
    };
  }, []);

  return platforms;
};
