import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

export default function GoogleMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { center, zoom = 12, markers = [], apiKey } = props;
  
  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key is required. Please set GOOGLE_MAPS_API_KEY environment variable or pass apiKey in props.');
      setIsLoading(false);
      return;
    }
    
    if (!center || !center.lat || !center.lng) {
      setError('Map center coordinates are required. Please provide center with lat and lng properties.');
      setIsLoading(false);
      return;
    }
    
    // Validate coordinates
    if (center.lat < -90 || center.lat > 90) {
      setError('Latitude must be between -90 and 90 degrees.');
      setIsLoading(false);
      return;
    }
    
    if (center.lng < -180 || center.lng > 180) {
      setError('Longitude must be between -180 and 180 degrees.');
      setIsLoading(false);
      return;
    }
    
    loadGoogleMapsAPI();
  }, [apiKey, center]);
  
  const loadGoogleMapsAPI = async () => {
    try {
      // Dynamic script loading for Google Maps
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        script.onerror = () => {
          setError('Failed to load Google Maps API. Please check your API key and network connection.');
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    } catch (err) {
      setError('Error loading Google Maps: ' + err.message);
      setIsLoading(false);
    }
  };
  
  const initializeMap = () => {
    if (!mapRef.current || !center) return;
    
    try {
      // Clamp zoom level to valid range
      const clampedZoom = Math.max(1, Math.min(20, zoom));
      
      const mapOptions = {
        center: { lat: center.lat, lng: center.lng },
        zoom: clampedZoom,
        mapTypeId: 'roadmap'
      };
      
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
      
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      
      // Add new markers
      if (Array.isArray(markers)) {
        markers.forEach(markerData => {
          // Validate marker coordinates
          if (!markerData.lat || !markerData.lng ||
              markerData.lat < -90 || markerData.lat > 90 ||
              markerData.lng < -180 || markerData.lng > 180) {
            console.warn('Invalid marker coordinates:', markerData);
            return;
          }
          
          const marker = new window.google.maps.Marker({
            position: { lat: markerData.lat, lng: markerData.lng },
            map: mapInstanceRef.current,
            title: markerData.popup || 'Marker'
          });
          
          if (markerData.popup) {
            const infoWindow = new window.google.maps.InfoWindow({
              content: markerData.popup
            });
            
            marker.addListener('click', () => {
              infoWindow.open(mapInstanceRef.current, marker);
            });
          }
          
          markersRef.current.push(marker);
        });
      }
      
      setIsLoading(false);
    } catch (err) {
      setError('Error initializing map: ' + err.message);
      setIsLoading(false);
    }
  };
  
  // Update map when props change
  useEffect(() => {
    if (mapInstanceRef.current && center && !isLoading) {
      try {
        mapInstanceRef.current.setCenter({ lat: center.lat, lng: center.lng });
        const clampedZoom = Math.max(1, Math.min(20, zoom));
        mapInstanceRef.current.setZoom(clampedZoom);
        initializeMap(); // Re-initialize markers
      } catch (err) {
        console.error('Error updating map:', err);
      }
    }
  }, [center, zoom, markers]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
      }
    };
  }, []);
  
  // Navigation controls
  const zoomIn = () => {
    if (mapInstanceRef.current) {
      const newZoom = Math.min(20, zoom + 1);
      mapInstanceRef.current.setZoom(newZoom);
      updateElement({ ...props, zoom: newZoom });
    }
  };
  
  const zoomOut = () => {
    if (mapInstanceRef.current) {
      const newZoom = Math.max(1, zoom - 1);
      mapInstanceRef.current.setZoom(newZoom);
      updateElement({ ...props, zoom: newZoom });
    }
  };
  
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {isLoading && (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-600">Loading Google Maps...</div>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className={`w-full h-96 rounded-lg border border-gray-200 ${isLoading ? 'hidden' : ''}`}
      />
      
      {/* Navigation Controls */}
      {!isLoading && !error && (
        <div className="absolute top-2 right-2 bg-white rounded-md shadow-lg p-1 space-y-1">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={zoomIn}
            disabled={zoom >= 20}
            className="w-8 h-8 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={zoomOut}
            disabled={zoom <= 1}
            className="w-8 h-8 p-0"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {/* Map Info */}
      {!isLoading && !error && (
        <div className="mt-2 text-sm text-gray-600">
          Center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)} | Zoom: {zoom} | Markers: {markers.length}
        </div>
      )}
    </div>
  );
}