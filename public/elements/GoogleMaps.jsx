import { useState, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2, AlertCircle } from 'lucide-react';

export default function GoogleMaps() {
  const [selectedMarker, setSelectedMarker] = useState(null);

  const handleMapClick = useCallback((event) => {
    const newMarker = {
      lat: event.detail.latLng.lat,
      lng: event.detail.latLng.lng,
      title: `Marker ${(props.markers?.length || 0) + 1}`,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    // Update backend with new marker
    updateElement({
      ...props,
      markers: [...(props.markers || []), newMarker]
    });
  }, [props]);

  const handleMarkerClick = useCallback((marker) => {
    setSelectedMarker(marker);
  }, []);

  const clearMarkers = useCallback(() => {
    updateElement({
      ...props,
      markers: []
    });
    setSelectedMarker(null);
  }, [props]);

  const removeMarker = useCallback((markerId) => {
    const updatedMarkers = (props.markers || []).filter(m => m.id !== markerId);
    updateElement({
      ...props,
      markers: updatedMarkers
    });
    setSelectedMarker(null);
  }, [props]);

  if (!props.apiKey) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-semibold">Google Maps API Key Required</h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please set GOOGLE_MAPS_API_KEY in your .env file
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <h3 className="font-semibold">Interactive Map</h3>
            {props.markers?.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({props.markers.length} markers)
              </span>
            )}
          </div>
          {props.markers?.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearMarkers}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Click on the map to add markers
        </p>
      </CardHeader>
      <CardContent>
        <APIProvider apiKey={props.apiKey}>
          <Map
            style={{ width: '100%', height: '400px' }}
            defaultCenter={props.center}
            defaultZoom={props.zoom}
            gestureHandling={'greedy'}
            disableDefaultUI={false}
            onClick={handleMapClick}
          >
            {(props.markers || []).map((marker) => (
              <AdvancedMarker
                key={marker.id}
                position={{ lat: marker.lat, lng: marker.lng }}
                onClick={() => handleMarkerClick(marker)}
              />
            ))}
            
            {selectedMarker && (
              <InfoWindow
                position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <h4 className="font-medium mb-1">{selectedMarker.title}</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeMarker(selectedMarker.id)}
                    className="h-6 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </CardContent>
    </Card>
  );
}