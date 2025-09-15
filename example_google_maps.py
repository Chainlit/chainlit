import chainlit as cl
import os

@cl.on_chat_start
async def on_start():
    await cl.Message(
        content="Welcome! Here's an interactive map. Click anywhere to add markers."
    ).send()
    
    # Create map with initial markers
    map_element = cl.GoogleMapsElement(
        center={"lat": 40.7128, "lng": -74.0060},
        zoom=12,
        markers=[
            {
                "lat": 40.7128,
                "lng": -74.0060, 
                "title": "New York City",
                "id": "nyc"
            }
        ]
    )
    
    await cl.Message(
        content="Click on the map to add new markers!",
        elements=[map_element]
    ).send()

# React to element updates (when users add markers)
@cl.on_element_update
async def on_element_update(element_id: str, element_type: str, element_props: dict):
    if element_type == "custom" and element_props.get("name") == "GoogleMaps":
        markers = element_props.get("markers", [])
        
        # Find the newest marker (last in array)
        if markers:
            newest_marker = markers[-1]
            await cl.Message(
                content=f"New marker added: {newest_marker['title']} at "
                       f"({newest_marker['lat']:.4f}, {newest_marker['lng']:.4f})"
            ).send()

@cl.on_message
async def on_message(message: cl.Message):
    if "san francisco" in message.content.lower():
        # Show San Francisco map
        sf_map = cl.GoogleMapsElement(
            center={"lat": 37.7749, "lng": -122.4194},
            zoom=13,
            markers=[]
        )
        
        await cl.Message(
            content="Here's San Francisco! Click to explore.",
            elements=[sf_map]
        ).send()
        
    elif "markers" in message.content.lower():
        # Show a map with multiple markers
        multi_marker_map = cl.GoogleMapsElement(
            center={"lat": 39.8283, "lng": -98.5795},  # Center of US
            zoom=4,
            markers=[
                {"lat": 40.7128, "lng": -74.0060, "title": "New York", "id": "ny"},
                {"lat": 34.0522, "lng": -118.2437, "title": "Los Angeles", "id": "la"},
                {"lat": 41.8781, "lng": -87.6298, "title": "Chicago", "id": "chi"}
            ]
        )
        
        await cl.Message(
            content="Here are some major US cities. Click to add more!",
            elements=[multi_marker_map]
        ).send()