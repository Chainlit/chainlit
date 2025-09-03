"""
Google Maps Helper for Chainlit CustomElement

This module provides utilities for creating Google Maps elements in Chainlit applications.
"""

import os
import chainlit as cl
from typing import List, Dict, Optional, Union


def create_google_map(
    center: Dict[str, float],
    zoom: int = 12,
    markers: Optional[List[Dict[str, Union[str, float]]]] = None,
    api_key: Optional[str] = None,
    name: str = "google-map",
    **kwargs
) -> cl.CustomElement:
    """
    Create a Google Maps element for Chainlit.
    
    Args:
        center: Dictionary with 'lat' and 'lng' keys for map center coordinates
        zoom: Zoom level (1-20, default: 12)
        markers: List of marker dictionaries with 'lat', 'lng', and optional 'popup' keys
        api_key: Google Maps API key (defaults to GOOGLE_MAPS_API_KEY env var)
        name: Element name/id (default: "google-map")
        **kwargs: Additional CustomElement parameters (display, size, etc.)
    
    Returns:
        CustomElement configured for Google Maps
        
    Raises:
        ValueError: If center coordinates are invalid or API key is missing
        
    Example:
        >>> # Simple map with one marker
        >>> map_element = create_google_map(
        ...     center={'lat': 37.7749, 'lng': -122.4194},
        ...     zoom=12,
        ...     markers=[
        ...         {'lat': 37.7749, 'lng': -122.4194, 'popup': 'San Francisco'}
        ...     ]
        ... )
        >>> await map_element.send()
    """
    
    # Validate center coordinates
    if not isinstance(center, dict) or 'lat' not in center or 'lng' not in center:
        raise ValueError("center must be a dict with 'lat' and 'lng' keys")
    
    if not isinstance(center['lat'], (int, float)) or not isinstance(center['lng'], (int, float)):
        raise ValueError("center coordinates must be numeric values")
        
    if not (-90 <= center['lat'] <= 90):
        raise ValueError("center latitude must be between -90 and 90 degrees")
        
    if not (-180 <= center['lng'] <= 180):
        raise ValueError("center longitude must be between -180 and 180 degrees")
    
    # Validate zoom level
    if not isinstance(zoom, int) or not (1 <= zoom <= 20):
        raise ValueError("zoom must be an integer between 1 and 20")
    
    # Get API key from parameter or environment variable
    if api_key is None:
        api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        
    if not api_key:
        raise ValueError(
            "Google Maps API key is required. "
            "Either pass api_key parameter or set GOOGLE_MAPS_API_KEY environment variable."
        )
    
    # Validate markers if provided
    if markers is not None:
        if not isinstance(markers, list):
            raise ValueError("markers must be a list")
            
        for i, marker in enumerate(markers):
            if not isinstance(marker, dict):
                raise ValueError(f"marker {i} must be a dict")
                
            if 'lat' not in marker or 'lng' not in marker:
                raise ValueError(f"marker {i} must have 'lat' and 'lng' keys")
                
            if not isinstance(marker['lat'], (int, float)) or not isinstance(marker['lng'], (int, float)):
                raise ValueError(f"marker {i} coordinates must be numeric values")
                
            if not (-90 <= marker['lat'] <= 90):
                raise ValueError(f"marker {i} latitude must be between -90 and 90 degrees")
                
            if not (-180 <= marker['lng'] <= 180):
                raise ValueError(f"marker {i} longitude must be between -180 and 180 degrees")
    
    # Create props for the CustomElement
    props = {
        'center': center,
        'zoom': zoom,
        'markers': markers or [],
        'apiKey': api_key
    }
    
    # Create and return the CustomElement
    return cl.CustomElement(
        name="GoogleMap",
        props=props,
        **kwargs
    )


class GoogleMapElement:
    """
    A wrapper class for Google Maps CustomElement that provides convenient update methods.
    
    Example:
        >>> map_el = create_google_map(
        ...     center={'lat': 40.7128, 'lng': -74.0060},
        ...     zoom=10
        ... )
        >>> await map_el.send()
        >>> 
        >>> # Wrap for easier updates
        >>> map_wrapper = GoogleMapElement(map_el)
        >>> await map_wrapper.update_center(40.7589, -73.9851, zoom=12)
        >>> await map_wrapper.add_marker(40.7589, -73.9851, "Times Square")
    """
    
    def __init__(self, element: cl.CustomElement):
        """
        Initialize with a CustomElement that has name="GoogleMap"
        
        Args:
            element: A CustomElement created with create_google_map() or equivalent
        """
        if not isinstance(element, cl.CustomElement):
            raise ValueError("element must be a CustomElement")
            
        if element.name != "GoogleMap":
            raise ValueError("element must have name='GoogleMap'")
            
        self.element = element
    
    async def update_center(self, lat: float, lng: float, zoom: Optional[int] = None):
        """
        Update map center and optionally zoom level.
        
        Args:
            lat: New latitude (-90 to 90)
            lng: New longitude (-180 to 180)
            zoom: New zoom level (1-20), optional
        """
        # Validate coordinates
        if not (-90 <= lat <= 90):
            raise ValueError("latitude must be between -90 and 90 degrees")
        if not (-180 <= lng <= 180):
            raise ValueError("longitude must be between -180 and 180 degrees")
            
        new_props = dict(self.element.props)
        new_props['center'] = {'lat': lat, 'lng': lng}
        
        if zoom is not None:
            if not isinstance(zoom, int) or not (1 <= zoom <= 20):
                raise ValueError("zoom must be an integer between 1 and 20")
            new_props['zoom'] = zoom
        
        self.element.props = new_props
        await self.element.update()
    
    async def add_marker(self, lat: float, lng: float, popup: Optional[str] = None):
        """
        Add a new marker to the map.
        
        Args:
            lat: Marker latitude (-90 to 90)
            lng: Marker longitude (-180 to 180) 
            popup: Optional popup text for the marker
        """
        # Validate coordinates
        if not (-90 <= lat <= 90):
            raise ValueError("latitude must be between -90 and 90 degrees")
        if not (-180 <= lng <= 180):
            raise ValueError("longitude must be between -180 and 180 degrees")
            
        new_marker = {'lat': lat, 'lng': lng}
        if popup:
            new_marker['popup'] = popup
            
        new_props = dict(self.element.props)
        markers = new_props.get('markers', [])
        markers.append(new_marker)
        new_props['markers'] = markers
        
        self.element.props = new_props
        await self.element.update()
    
    async def clear_markers(self):
        """Remove all markers from the map."""
        new_props = dict(self.element.props)
        new_props['markers'] = []
        
        self.element.props = new_props
        await self.element.update()
    
    async def set_zoom(self, zoom: int):
        """
        Set the zoom level.
        
        Args:
            zoom: Zoom level (1-20)
        """
        if not isinstance(zoom, int) or not (1 <= zoom <= 20):
            raise ValueError("zoom must be an integer between 1 and 20")
            
        new_props = dict(self.element.props)
        new_props['zoom'] = zoom
        
        self.element.props = new_props
        await self.element.update()


# Example usage patterns
def example_usage():
    """
    Example patterns for using Google Maps in Chainlit applications.
    """
    return '''
# Example 1: Basic map with markers
import chainlit as cl
from google_maps_helper import create_google_map, GoogleMapElement

@cl.on_message
async def main(message: cl.Message):
    # Create a map centered on San Francisco with markers
    google_map = create_google_map(
        center={'lat': 37.7749, 'lng': -122.4194},
        zoom=12,
        markers=[
            {'lat': 37.7749, 'lng': -122.4194, 'popup': 'San Francisco City Center'},
            {'lat': 37.8044, 'lng': -122.2711, 'popup': 'Oakland'},
            {'lat': 37.6879, 'lng': -122.4702, 'popup': 'Daly City'}
        ]
    )
    
    await cl.Message(
        content="Here's a map of the San Francisco Bay Area:",
        elements=[google_map]
    ).send()


# Example 2: Interactive map updates
@cl.on_message  
async def interactive_map(message: cl.Message):
    # Create initial map
    map_element = create_google_map(
        center={'lat': 40.7128, 'lng': -74.0060},
        zoom=10,
        name="nyc-map"
    )
    
    await cl.Message(
        content="Interactive NYC Map - I can update this!",
        elements=[map_element] 
    ).send()
    
    # Wrap for easy updates
    map_wrapper = GoogleMapElement(map_element)
    
    # Add some famous NYC landmarks
    await map_wrapper.add_marker(40.7589, -73.9851, "Times Square")
    await map_wrapper.add_marker(40.6892, -74.0445, "Statue of Liberty") 
    await map_wrapper.add_marker(40.7614, -73.9776, "Central Park")
    
    # Focus on Manhattan
    await map_wrapper.update_center(40.7831, -73.9712, zoom=12)


# Example 3: Environment setup
# Make sure to set your Google Maps API key:
# export GOOGLE_MAPS_API_KEY="your_api_key_here"
# 
# Or pass it directly:
# google_map = create_google_map(
#     center={'lat': 37.7749, 'lng': -122.4194},
#     api_key="your_api_key_here"
# )
'''