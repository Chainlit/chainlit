import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { IMapElement } from '@chainlit/react-client';
import Alert from '@/components/Alert';

interface GoogleMapProps {
  element: IMapElement;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

const MapElement = ({ element }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapConfig, setMapConfig] = useState<any>(null);

  const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // San Francisco
  const defaultZoom = 10;

  // Parse map configuration from element content or use element properties
  useEffect(() => {
    try {
      if (element.url) {
        // If there's a URL, fetch the content
        fetch(element.url)
          .then(response => response.text())
          .then(content => {
            try {
              const config = JSON.parse(content);
              setMapConfig(config);
            } catch (e) {
              setMapConfig({
                apiKey: element.apiKey,
                center: element.center,
                zoom: element.zoom,
                markers: element.markers,
                height: element.height,
                width: element.width,
              });
            }
          })
          .catch(() => {
            setMapConfig({
              apiKey: element.apiKey,
              center: element.center,
              zoom: element.zoom,
              markers: element.markers,
              height: element.height,
              width: element.width,
            });
          });
      } else {
        // Use element properties directly
        setMapConfig({
          apiKey: element.apiKey,
          center: element.center,
          zoom: element.zoom,
          markers: element.markers,
          height: element.height,
          width: element.width,
        });
      }
    } catch (e) {
      setError('Failed to parse map configuration');
      setIsLoading(false);
    }
  }, [element]);

  useEffect(() => {
    if (!mapConfig) return;

    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkGoogleMaps = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkGoogleMaps);
            initializeMap();
          }
        }, 100);
        return;
      }

      const apiKey = mapConfig.apiKey || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setError('Google Maps API key is required. Please provide an API key.');
        setIsLoading(false);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => {
        setError('Failed to load Google Maps API');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google) {
        setError('Google Maps failed to initialize');
        setIsLoading(false);
        return;
      }

      try {
        const center = mapConfig.center || defaultCenter;
        const zoom = mapConfig.zoom || defaultZoom;

        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        // Add markers if provided
        if (mapConfig.markers && mapConfig.markers.length > 0) {
          mapConfig.markers.forEach((marker) => {
            const mapMarker = new window.google.maps.Marker({
              position: { lat: marker.lat, lng: marker.lng },
              map: mapInstance,
              title: marker.title,
            });

            if (marker.description) {
              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div>
                    ${marker.title ? `<h3>${marker.title}</h3>` : ''}
                    <p>${marker.description}</p>
                  </div>
                `,
              });

              mapMarker.addListener('click', () => {
                infoWindow.open(mapInstance, mapMarker);
              });
            }
          });
        }

        setMap(mapInstance);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize Google Maps');
        setIsLoading(false);
      }
    };

    loadGoogleMapsScript();

    return () => {
      // Cleanup if needed
    };
  }, [mapConfig]);

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!mapConfig) {
    return (
      <div className="text-gray-500 p-4">
        Loading map configuration...
      </div>
    );
  }

  const height = mapConfig.height || '400px';
  const width = mapConfig.width || '100%';

  return (
    <div className={cn('rounded-sm bg-accent overflow-hidden', `${element.display}-map`)}>
      <div
        ref={mapRef}
        style={{
          height,
          width,
          minHeight: '300px',
          background: isLoading ? '#f5f5f5' : 'transparent',
        }}
        className={cn(
          'w-full',
          isLoading && 'flex items-center justify-center'
        )}
      >
        {isLoading && (
          <div className="text-gray-500">
            Loading Google Maps...
          </div>
        )}
      </div>
    </div>
  );
};

export { MapElement };