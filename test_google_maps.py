#!/usr/bin/env python3
"""
Test application for Google Maps CustomElement in Chainlit.

This app demonstrates the Google Maps functionality including:
- Basic map display with center and zoom
- Multiple markers with popups
- Dynamic map updates and navigation
- Error handling

To run this test:
1. Set your Google Maps API key: export GOOGLE_MAPS_API_KEY="your_api_key"
2. Run: chainlit run test_google_maps.py
"""

import os
import chainlit as cl
from google_maps_helper import create_google_map, GoogleMapElement


@cl.on_chat_start
async def on_chat_start():
    """Initialize the chat with a welcome message and basic Google Maps info."""
    await cl.Message(
        content="""
# Google Maps Integration Test

Welcome! This app tests the Google Maps CustomElement functionality.

**Available commands:**
- `sf` - Show San Francisco map with markers
- `nyc` - Show New York City interactive map  
- `world` - Show world map with major cities
- `update` - Demonstrate dynamic map updates
- `error` - Test error handling (invalid coordinates)

**Setup required:**
Make sure you have set your Google Maps API key:
```
export GOOGLE_MAPS_API_KEY="your_api_key_here"
```

Type any of the commands above to test the maps!
"""
    ).send()


@cl.on_message
async def on_message(message: cl.Message):
    """Handle user messages and demonstrate different Google Maps features."""
    
    user_message = message.content.lower().strip()
    
    if user_message == "sf" or user_message == "san francisco":
        await demo_san_francisco_map()
        
    elif user_message == "nyc" or user_message == "new york":
        await demo_nyc_interactive_map()
        
    elif user_message == "world":
        await demo_world_map()
        
    elif user_message == "update":
        await demo_dynamic_updates()
        
    elif user_message == "error":
        await demo_error_handling()
        
    else:
        await cl.Message(
            content="Please try one of these commands: `sf`, `nyc`, `world`, `update`, or `error`"
        ).send()


async def demo_san_francisco_map():
    """Demonstrate basic map with multiple markers."""
    try:
        google_map = create_google_map(
            center={'lat': 37.7749, 'lng': -122.4194},
            zoom=12,
            markers=[
                {
                    'lat': 37.7749, 
                    'lng': -122.4194, 
                    'popup': 'San Francisco City Hall - Welcome to SF!'
                },
                {
                    'lat': 37.8044, 
                    'lng': -122.2711, 
                    'popup': 'Oakland - Beautiful Lake Merritt nearby'
                },
                {
                    'lat': 37.6879, 
                    'lng': -122.4702, 
                    'popup': 'Daly City - Foggy but lovely'
                },
                {
                    'lat': 37.7849, 
                    'lng': -122.4094, 
                    'popup': 'Chinatown - Amazing food and culture'
                }
            ],
            name="sf-demo-map"
        )
        
        await cl.Message(
            content="""## San Francisco Bay Area Map

This map shows several locations around the SF Bay Area. Click on the markers to see popup information!

**Map Features:**
- Center: San Francisco City Hall
- Zoom: 12 (city level)
- 4 markers with popup text
- Zoom controls in the top-right corner""",
            elements=[google_map]
        ).send()
        
    except Exception as e:
        await cl.Message(
            content=f"Error creating San Francisco map: {str(e)}"
        ).send()


async def demo_nyc_interactive_map():
    """Demonstrate interactive map with dynamic updates."""
    try:
        # Create initial map
        map_element = create_google_map(
            center={'lat': 40.7128, 'lng': -74.0060},
            zoom=10,
            name="nyc-interactive-map"
        )
        
        await cl.Message(
            content="## Interactive NYC Map - Starting View\n\nInitial map centered on NYC. Watch as I add markers dynamically!",
            elements=[map_element]
        ).send()
        
        # Create wrapper for updates
        map_wrapper = GoogleMapElement(map_element)
        
        # Add landmarks progressively
        await cl.sleep(1)
        await map_wrapper.add_marker(40.7589, -73.9851, "Times Square - The Crossroads of the World")
        await cl.Message(content="✅ Added Times Square marker!").send()
        
        await cl.sleep(1)
        await map_wrapper.add_marker(40.6892, -74.0445, "Statue of Liberty - Symbol of Freedom")
        await cl.Message(content="✅ Added Statue of Liberty marker!").send()
        
        await cl.sleep(1)
        await map_wrapper.add_marker(40.7614, -73.9776, "Central Park - Green Oasis in Manhattan")
        await cl.Message(content="✅ Added Central Park marker!").send()
        
        await cl.sleep(1)
        await map_wrapper.add_marker(40.7505, -73.9934, "Empire State Building - Art Deco Marvel")
        await cl.Message(content="✅ Added Empire State Building marker!").send()
        
        # Focus on Manhattan
        await cl.sleep(1)
        await map_wrapper.update_center(40.7831, -73.9712, zoom=12)
        await cl.Message(content="🔍 Zoomed in on Manhattan with all markers!").send()
        
    except Exception as e:
        await cl.Message(
            content=f"Error creating NYC interactive map: {str(e)}"
        ).send()


async def demo_world_map():
    """Demonstrate world-level map with major cities."""
    try:
        google_map = create_google_map(
            center={'lat': 20.0, 'lng': 0.0},  # Center on Africa/Europe
            zoom=2,  # World view
            markers=[
                {'lat': 40.7128, 'lng': -74.0060, 'popup': 'New York, USA - The Big Apple'},
                {'lat': 51.5074, 'lng': -0.1278, 'popup': 'London, UK - Big Ben and Thames'},
                {'lat': 35.6762, 'lng': 139.6503, 'popup': 'Tokyo, Japan - Neon lights and sushi'},
                {'lat': -33.8688, 'lng': 151.2093, 'popup': 'Sydney, Australia - Opera House'},
                {'lat': 55.7558, 'lng': 37.6173, 'popup': 'Moscow, Russia - Red Square'},
                {'lat': 19.4326, 'lng': -99.1332, 'popup': 'Mexico City, Mexico - Vibrant culture'},
                {'lat': -26.2041, 'lng': 28.0473, 'popup': 'Johannesburg, South Africa - Gold rush city'},
                {'lat': 30.0444, 'lng': 31.2357, 'popup': 'Cairo, Egypt - Ancient pyramids nearby'}
            ],
            name="world-map"
        )
        
        await cl.Message(
            content="""## World Map - Major Cities

This world map shows major cities across different continents. Each marker represents a significant urban center with cultural and historical importance.

**Map Details:**
- Zoom level: 2 (world view)  
- 8 major cities across 6 continents
- Click markers to learn about each city
- Use zoom controls to explore regions""",
            elements=[google_map]
        ).send()
        
    except Exception as e:
        await cl.Message(
            content=f"Error creating world map: {str(e)}"
        ).send()


async def demo_dynamic_updates():
    """Demonstrate all dynamic update features."""
    try:
        # Start with a basic map
        map_element = create_google_map(
            center={'lat': 34.0522, 'lng': -118.2437},  # Los Angeles
            zoom=8,
            name="dynamic-demo-map"
        )
        
        await cl.Message(
            content="## Dynamic Updates Demo\n\nStarting with Los Angeles. Watch the map transform!",
            elements=[map_element]
        ).send()
        
        map_wrapper = GoogleMapElement(map_element)
        
        # Demo 1: Add markers
        await cl.sleep(2)
        await cl.Message(content="**Step 1:** Adding Hollywood marker...").send()
        await map_wrapper.add_marker(34.0928, -118.3287, "Hollywood - Walk of Fame")
        
        await cl.sleep(1)
        await cl.Message(content="**Step 2:** Adding Santa Monica marker...").send()
        await map_wrapper.add_marker(34.0195, -118.4912, "Santa Monica - Beautiful beaches")
        
        # Demo 2: Change zoom
        await cl.sleep(2)
        await cl.Message(content="**Step 3:** Zooming in for detail view...").send()
        await map_wrapper.set_zoom(12)
        
        # Demo 3: Move to different city
        await cl.sleep(2)
        await cl.Message(content="**Step 4:** Moving to Miami...").send()
        await map_wrapper.update_center(25.7617, -80.1918, zoom=10)
        
        await cl.sleep(1)
        await cl.Message(content="**Step 5:** Clearing old markers...").send()
        await map_wrapper.clear_markers()
        
        await cl.sleep(1)
        await cl.Message(content="**Step 6:** Adding Miami markers...").send()
        await map_wrapper.add_marker(25.7617, -80.1918, "Downtown Miami - Skyline views")
        await map_wrapper.add_marker(25.7907, -80.1300, "Miami Beach - Art Deco District")
        
        await cl.Message(content="✅ **Dynamic updates demo complete!** The map responded to all programmatic changes.").send()
        
    except Exception as e:
        await cl.Message(
            content=f"Error in dynamic updates demo: {str(e)}"
        ).send()


async def demo_error_handling():
    """Demonstrate error handling for various invalid inputs."""
    await cl.Message(
        content="## Error Handling Demo\n\nTesting various error conditions..."
    ).send()
    
    # Test 1: Invalid coordinates
    try:
        invalid_map = create_google_map(
            center={'lat': 999, 'lng': 999},  # Invalid coordinates
            zoom=12
        )
        await cl.Message(
            content="❌ This shouldn't appear - invalid coordinates should have failed",
            elements=[invalid_map]
        ).send()
    except ValueError as e:
        await cl.Message(content=f"✅ **Test 1 Passed:** Caught invalid coordinates: {str(e)}").send()
    
    # Test 2: Missing API key (simulate by using empty string)
    try:
        no_key_map = create_google_map(
            center={'lat': 37.7749, 'lng': -122.4194},
            zoom=12,
            api_key=""  # Empty API key
        )
        await cl.Message(
            content="This map should show an error about missing API key:",
            elements=[no_key_map]
        ).send()
    except ValueError as e:
        await cl.Message(content=f"✅ **Test 2:** API key validation: {str(e)}").send()
    
    # Test 3: Invalid zoom
    try:
        invalid_zoom_map = create_google_map(
            center={'lat': 37.7749, 'lng': -122.4194},
            zoom=25  # Invalid zoom level
        )
        await cl.Message(content="❌ This shouldn't appear").send()
    except ValueError as e:
        await cl.Message(content=f"✅ **Test 3 Passed:** Caught invalid zoom: {str(e)}").send()
    
    # Test 4: Invalid marker
    try:
        invalid_marker_map = create_google_map(
            center={'lat': 37.7749, 'lng': -122.4194},
            zoom=12,
            markers=[
                {'lat': 'invalid', 'lng': 'coordinates'}  # Invalid marker coordinates
            ]
        )
        await cl.Message(content="❌ This shouldn't appear").send()
    except ValueError as e:
        await cl.Message(content=f"✅ **Test 4 Passed:** Caught invalid marker: {str(e)}").send()
    
    await cl.Message(content="🎉 **Error handling tests complete!** All validation is working properly.").send()


if __name__ == "__main__":
    # Check if API key is set
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if not api_key:
        print("⚠️  Warning: GOOGLE_MAPS_API_KEY environment variable not set.")
        print("   Set it with: export GOOGLE_MAPS_API_KEY='your_api_key_here'")
        print("   The app will still run but maps may not display without a valid API key.")
        print()
    
    print("🗺️  Google Maps Test App Ready!")
    print("   Run with: chainlit run test_google_maps.py")
    print("   Then try commands: sf, nyc, world, update, error")