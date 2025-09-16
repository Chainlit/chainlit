"""
Google Maps Element Example

This example demonstrates how to use the GoogleMaps element in Chainlit.
Make sure to set VITE_GOOGLE_MAPS_API_KEY in your .env file.

Usage:
1. Add VITE_GOOGLE_MAPS_API_KEY=your_api_key to .env
2. Run: chainlit run googlemaps_example.py
"""

import chainlit as cl


@cl.on_message
async def main(message: cl.Message):
    """Handle incoming messages."""
    
    if message.content.lower().startswith("map"):
        # Example 1: Basic map with center and zoom
        if "basic" in message.content.lower():
            basic_map = cl.GoogleMaps(
                name="basic_map",
                center={"lat": 37.7749, "lng": -122.4194},  # San Francisco
                zoom=12
            )
            await basic_map.send(for_id=message.id)
            await cl.Message(content="Here's a basic map of San Francisco!").send()
        
        # Example 2: Map with markers
        elif "markers" in message.content.lower():
            markers_map = cl.GoogleMaps(
                name="markers_map",
                center={"lat": 40.7829, "lng": -73.9654},  # NYC Central Park
                zoom=15,
                markers=[
                    {
                        "lat": 40.7829,
                        "lng": -73.9654,
                        "title": "Central Park",
                        "content": "<h3>Central Park</h3><p>A large public park in Manhattan, NYC</p>"
                    },
                    {
                        "lat": 40.7831,
                        "lng": -73.9712,
                        "title": "American Museum of Natural History",
                        "content": "<h3>Natural History Museum</h3><p>Famous museum on the Upper West Side</p>"
                    },
                    {
                        "lat": 40.7794,
                        "lng": -73.9632,
                        "title": "The Metropolitan Museum of Art",
                        "content": "<h3>The Met</h3><p>One of the world's largest art museums</p>"
                    }
                ]
            )
            await markers_map.send(for_id=message.id)
            await cl.Message(content="Here's a map of Central Park with some nearby museums!").send()
        
        # Example 3: World map with multiple locations
        elif "world" in message.content.lower():
            world_map = cl.GoogleMaps(
                name="world_map",
                center={"lat": 20, "lng": 0},  # Center on Africa
                zoom=2,
                markers=[
                    {
                        "lat": 48.8566,
                        "lng": 2.3522,
                        "title": "Paris, France",
                        "content": "<h3>Paris</h3><p>The City of Light</p>"
                    },
                    {
                        "lat": 35.6762,
                        "lng": 139.6503,
                        "title": "Tokyo, Japan",
                        "content": "<h3>Tokyo</h3><p>Japan's bustling capital</p>"
                    },
                    {
                        "lat": -33.8688,
                        "lng": 151.2093,
                        "title": "Sydney, Australia",
                        "content": "<h3>Sydney</h3><p>Famous for the Opera House and Harbour Bridge</p>"
                    },
                    {
                        "lat": 40.7128,
                        "lng": -74.0060,
                        "title": "New York City, USA",
                        "content": "<h3>New York City</h3><p>The Big Apple</p>"
                    }
                ]
            )
            await world_map.send(for_id=message.id)
            await cl.Message(content="Here's a world map with famous cities!").send()
        
        # Default help message
        else:
            help_message = """
**Google Maps Examples:**

Try these commands:
- `map basic` - Show a basic map of San Francisco
- `map markers` - Show Central Park with nearby museums
- `map world` - Show a world map with famous cities

**Requirements:**
- Make sure VITE_GOOGLE_MAPS_API_KEY is set in your .env file
- Get your API key from Google Cloud Console with Maps JavaScript API enabled
            """
            await cl.Message(content=help_message).send()
    
    else:
        # Default response
        await cl.Message(
            content="Hello! I can show you Google Maps examples. Try typing 'map' to see available options!"
        ).send()


@cl.on_chat_start
async def start():
    """Welcome message when chat starts."""
    welcome_message = """
# Welcome to Google Maps Integration Demo! 🗺️

This demo shows how to use Google Maps elements in Chainlit.

**Available Commands:**
- `map basic` - Basic map example
- `map markers` - Map with markers and info windows
- `map world` - World map with multiple locations

Make sure you have set up your Google Maps API key in the .env file as `VITE_GOOGLE_MAPS_API_KEY`.
    """
    
    await cl.Message(content=welcome_message).send()