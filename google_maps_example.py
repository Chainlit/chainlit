#!/usr/bin/env python3
"""
Example usage of the new Google Maps element in Chainlit

This demonstrates how to use the new Map element to display Google Maps
in your Chainlit application.
"""

import chainlit as cl


@cl.on_message
async def main(message: cl.Message):
    """Example of using the new Google Maps element."""

    if message.content.lower() == "show map":
        # Basic map with default location (San Francisco)
        map_element = cl.Map(
            name="Basic Map",
            api_key="YOUR_GOOGLE_MAPS_API_KEY",  # Replace with actual key
        )
        await map_element.send(for_id=message.id)

        await cl.Message(content="Here's a basic Google Map!").send()

    elif message.content.lower() == "show custom map":
        # Custom map with specific location and markers
        map_element = cl.Map(
            name="Custom Map",
            api_key="YOUR_GOOGLE_MAPS_API_KEY",  # Replace with actual key
            center={"lat": 40.7128, "lng": -74.0060},  # New York City
            zoom=12,
            height="500px",
            width="100%"
        )

        # Add markers
        await map_element.add_marker(
            lat=40.7589, lng=-73.9851,
            title="Times Square",
            description="The heart of NYC"
        )

        await map_element.add_marker(
            lat=40.7505, lng=-73.9934,
            title="Empire State Building",
            description="Famous skyscraper"
        )

        await map_element.send(for_id=message.id)

        await cl.Message(content="Here's a custom map of New York City with markers!").send()

    else:
        await cl.Message(
            content="Try typing 'show map' for a basic map or 'show custom map' for a custom map with markers!"
        ).send()


if __name__ == "__main__":
    print("Run this with: chainlit run google_maps_example.py")
    print("\nMake sure to:")
    print("1. Get a Google Maps API key from https://developers.google.com/maps/documentation/javascript/get-api-key")
    print("2. Replace 'YOUR_GOOGLE_MAPS_API_KEY' with your actual API key")
    print("3. Enable the Maps JavaScript API in your Google Cloud Console")