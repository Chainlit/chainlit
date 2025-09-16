"""
Simple test to verify GoogleMaps element can be instantiated correctly.
This tests the core functionality without requiring the full Chainlit environment.
"""
import json
from typing import Dict, List, ClassVar
from dataclasses import dataclass, field

# Mock the Field import
def Field(default_factory=None, **kwargs):
    if default_factory:
        return field(default_factory=default_factory)
    return field()

# Mock the Element base class
@dataclass
class Element:
    type: ClassVar[str]
    name: str = ""
    id: str = "test-id"
    content: str = ""
    mime: str = ""
    
    def __post_init__(self):
        pass

# Define GoogleMaps element (copy of the implementation)
@dataclass
class GoogleMaps(Element):
    """Useful to send a Google Maps element to the UI."""

    type: ClassVar[str] = "googlemaps"
    size: str = "large"
    center: Dict = Field(default_factory=lambda: {"lat": 0, "lng": 0})
    zoom: int = 10
    markers: List[Dict] = Field(default_factory=list)

    def __post_init__(self) -> None:
        map_config = {
            "center": self.center,
            "zoom": self.zoom,
            "markers": self.markers
        }
        self.content = json.dumps(map_config)
        self.mime = "application/json"
        super().__post_init__()

def test_googlemaps_creation():
    """Test basic GoogleMaps element creation."""
    
    # Test 1: Basic GoogleMaps with defaults
    basic_map = GoogleMaps(name="test_map")
    assert basic_map.type == "googlemaps"
    assert basic_map.name == "test_map"
    assert basic_map.size == "large"
    assert basic_map.center == {"lat": 0, "lng": 0}
    assert basic_map.zoom == 10
    assert basic_map.markers == []
    assert basic_map.mime == "application/json"
    
    # Verify content is valid JSON
    config = json.loads(basic_map.content)
    assert config["center"] == {"lat": 0, "lng": 0}
    assert config["zoom"] == 10
    assert config["markers"] == []
    print("✓ Basic GoogleMaps creation test passed")
    
    # Test 2: GoogleMaps with custom parameters
    custom_map = GoogleMaps(
        name="custom_map",
        center={"lat": 37.7749, "lng": -122.4194},
        zoom=12,
        markers=[
            {
                "lat": 37.7749,
                "lng": -122.4194,
                "title": "San Francisco",
                "content": "The City by the Bay"
            }
        ]
    )
    
    assert custom_map.center == {"lat": 37.7749, "lng": -122.4194}
    assert custom_map.zoom == 12
    assert len(custom_map.markers) == 1
    assert custom_map.markers[0]["title"] == "San Francisco"
    
    # Verify content serialization
    config = json.loads(custom_map.content)
    assert config["center"]["lat"] == 37.7749
    assert config["zoom"] == 12
    assert len(config["markers"]) == 1
    print("✓ Custom GoogleMaps creation test passed")
    
    # Test 3: Multiple markers
    multi_marker_map = GoogleMaps(
        name="multi_marker_map",
        markers=[
            {"lat": 40.7128, "lng": -74.0060, "title": "NYC"},
            {"lat": 34.0522, "lng": -118.2437, "title": "LA"},
            {"lat": 41.8781, "lng": -87.6298, "title": "Chicago"}
        ]
    )
    
    assert len(multi_marker_map.markers) == 3
    config = json.loads(multi_marker_map.content)
    assert len(config["markers"]) == 3
    assert config["markers"][0]["title"] == "NYC"
    print("✓ Multiple markers test passed")
    
    print("\n🎉 All GoogleMaps element tests passed!")

if __name__ == "__main__":
    test_googlemaps_creation()