import { useEffect, useState } from 'react';
import { useIsMounted } from 'usehooks-ts';

const useWindowLocation = (): Location | void => {
  const isMounted = useIsMounted();
  const [location, setLocation] = useState<Location | void>(
    isMounted() && typeof window !== 'undefined' ? window.location : undefined
  );

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;

    const setWindowLocation = () => {
      setLocation(window.location);
    };

    if (!location) {
      setWindowLocation();
    }

    window?.addEventListener('popstate', setWindowLocation);

    return () => {
      window.removeEventListener('popstate', setWindowLocation);
    };
  }, [isMounted, location]);

  return location;
};

export default useWindowLocation;
