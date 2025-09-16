import React, { useCallback, useState, useRef } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

import { useFetch } from 'hooks/useFetch';

import { type IGoogleMapsElement } from 'client-types/';

interface MapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: Array<{
    lat: number;
    lng: number;
    title?: string;
    content?: string;
  }>;
  onCenterChanged?: (center: { lat: number; lng: number }) => void;
  onMarkerClick?: (marker: any) => void;
}

const Map: React.FC<MapProps> = ({ 
  center, 
  zoom, 
  markers, 
  onCenterChanged, 
  onMarkerClick 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [markersState, setMarkersState] = useState<google.maps.Marker[]>([]);

  React.useEffect(() => {
    if (ref.current && !map) {
      const newMap = new google.maps.Map(ref.current, {
        center,
        zoom,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: true,
      });
      
      setMap(newMap);

      // Listen for center changes
      if (onCenterChanged) {
        newMap.addListener('center_changed', () => {
          const center = newMap.getCenter();
          if (center) {
            onCenterChanged({
              lat: center.lat(),
              lng: center.lng()
            });
          }
        });
      }
    }
  }, [ref, map, center, zoom, onCenterChanged]);

  // Update markers when markers prop changes
  React.useEffect(() => {
    if (map) {
      // Clear existing markers
      markersState.forEach(marker => marker.setMap(null));
      
      // Create new markers
      const newMarkers = markers.map(markerData => {
        const marker = new google.maps.Marker({
          position: { lat: markerData.lat, lng: markerData.lng },
          map: map,
          title: markerData.title || '',
        });

        // Add click listener for info window
        if (markerData.content) {
          const infoWindow = new google.maps.InfoWindow({
            content: markerData.content,
          });

          marker.addListener('click', () => {
            infoWindow.open({
              anchor: marker,
              map,
            });
            if (onMarkerClick) {
              onMarkerClick(markerData);
            }
          });
        } else if (onMarkerClick) {
          marker.addListener('click', () => {
            onMarkerClick(markerData);
          });
        }

        return marker;
      });

      setMarkersState(newMarkers);
    }
  }, [map, markers, onMarkerClick]);

  // Update center and zoom when props change
  React.useEffect(() => {
    if (map) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  return <div ref={ref} style={{ width: '100%', height: '400px' }} />;
};

interface Props {
  element: IGoogleMapsElement;
}

const _GoogleMapsElement = ({ element }: Props) => {
  const { data, error, isLoading } = useFetch(element.url || null);

  if (isLoading) {
    return (
      <Skeleton className="h-[400px] w-full rounded-md" />
    );
  } 
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] w-full border rounded-md">
        <div className="text-center">
          <div className="text-red-500 mb-2">Failed to load map</div>
          <div className="text-sm text-gray-500">{error.message}</div>
        </div>
      </div>
    );
  }

  let mapConfig;
  try {
    mapConfig = data ? data : { 
      center: { lat: 0, lng: 0 }, 
      zoom: 2, 
      markers: [] 
    };
  } catch (e) {
    return (
      <div className="flex items-center justify-center h-[400px] w-full border rounded-md">
        <div className="text-center">
          <div className="text-red-500 mb-2">Invalid map data</div>
          <div className="text-sm text-gray-500">Unable to parse map configuration</div>
        </div>
      </div>
    );
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-[400px] w-full border rounded-md">
        <div className="text-center">
          <div className="text-yellow-600 mb-2">Google Maps API Key Missing</div>
          <div className="text-sm text-gray-500">
            Please set VITE_GOOGLE_MAPS_API_KEY environment variable
          </div>
        </div>
      </div>
    );
  }

  const render = (status: string) => {
    if (status === 'FAILURE') {
      return (
        <div className="flex items-center justify-center h-[400px] w-full border rounded-md">
          <div className="text-center">
            <div className="text-red-500 mb-2">Failed to load Google Maps</div>
            <div className="text-sm text-gray-500">Check your API key and internet connection</div>
          </div>
        </div>
      );
    }
    
    return (
      <Skeleton className="h-[400px] w-full rounded-md" />
    );
  };

  return (
    <div className={`${element.display}-googlemaps w-full`}>
      <Wrapper apiKey={apiKey} render={render}>
        <Map
          center={mapConfig.center}
          zoom={mapConfig.zoom}
          markers={mapConfig.markers || []}
        />
      </Wrapper>
    </div>
  );
};

const GoogleMapsElement = (props: Props) => {
  return (
    <ErrorBoundary prefix="Failed to load map.">
      <_GoogleMapsElement {...props} />
    </ErrorBoundary>
  );
};

export { GoogleMapsElement };