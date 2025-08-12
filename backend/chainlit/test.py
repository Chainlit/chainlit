#!/usr/bin/env python3
"""
Example script demonstrating dynamic configuration management with ChatProfiles.

This example shows how to:
1. Define multiple chat profiles
2. Dynamically update configuration when switching profiles
3. Provide profile-specific features and UI customization

To run this example:
1. Save as app.py
2. Run: chainlit run app.py -w
3. Open browser and try switching between profiles
"""

import chainlit as cl
from mcp import ClientSession

@cl.on_mcp_connect
async def on_mcp_connect(connection, session: ClientSession):
    """Called when an MCP connection is established"""
    # Your connection initialization code here
    # This handler is required for MCP to work
    
@cl.on_mcp_disconnect
async def on_mcp_disconnect(name: str, session: ClientSession):
    """Called when an MCP connection is terminated"""
    # Your cleanup code here
    # This handler is optional

import chainlit as cl
from chainlit.types import ChatProfile
from chainlit.config import ChainlitConfigOverrides, FeaturesSettings, UISettings, ProjectSettings, SpontaneousFileUploadFeature, McpFeature, McpSseFeature


# Define available chat profiles
@cl.set_chat_profiles
async def chat_profile():
    return [
        ChatProfile(
            name="text-assistant",
            markdown_description="A text-only assistant for general conversations",
            icon="💬",
            default=True,
        ),
        ChatProfile(
            name="vision-assistant", 
            markdown_description="AI assistant with image analysis",
            icon="👁️",
            config_overrides=ChainlitConfigOverrides(
                features=FeaturesSettings(
                    spontaneous_file_upload=SpontaneousFileUploadFeature(
                        enabled=True,
                        accept=["image/*"],
                        max_files=5,
                        max_size_mb=10
                    ),
                    mcp=McpFeature(
                        enabled=True,
                        sse=McpSseFeature(enabled=True)
                    )
                ),
                ui=UISettings(
                    name="Vision Assistant",
                    description="AI assistant with advanced vision capabilities"
                ),
            )
        ),
        ChatProfile(
            name="document-assistant",
            markdown_description="Specialized assistant for document processing and analysis",
            icon="📄",
        ),
    ]

@cl.on_chat_start
async def start_chat():
    """Initialize the chat with profile-specific welcome message."""
    
    # Get the current profile from the session
    current_profile = cl.context.session.chat_profile or "text-assistant"
    
    print(f"Started Chat With: {current_profile}")

@cl.on_message
async def handle_message(message: cl.Message):
    """Handle incoming messages with profile-aware responses."""
    
    current_profile = cl.context.session.chat_profile or "text-assistant"
    
    # Handle file attachments based on current profile
    if message.elements:
        file_descriptions = []
        for element in message.elements:
            if hasattr(element, 'name'):
                file_descriptions.append(f"📎 {element.name}")
        
        if file_descriptions:
            files_text = "\n".join(file_descriptions)
            
            if current_profile == "vision-assistant":
                response = f"🖼️ I can see you've uploaded:\n{files_text}\n\nAs your Vision Assistant, I'm ready to analyze these images! What would you like me to focus on?"
                
            elif current_profile == "document-assistant":
                response = f"📄 I've received your documents:\n{files_text}\n\nAs your Document Assistant, I can help you analyze, summarize, or extract information. What would you like me to do?"
                
            else:
                response = f"📎 I see you've uploaded files:\n{files_text}\n\nNote: This profile has limited file processing capabilities. Consider switching to Vision Assistant or Document Assistant for better file handling."
        else:
            response = "I notice you mentioned files, but I don't see any attachments. Please make sure to upload your files!"
    else:
        # Text-only response based on profile
        profile_responses = {
            "text-assistant": f"💬 **Text Assistant Response**: {message.content}\n\nI understand your message! As a text-focused assistant, I'm optimized for conversations, Q&A, and text-based tasks.",
            
            "vision-assistant": f"👁️ **Vision Assistant Response**: {message.content}\n\nI'm ready to help! While I can handle text conversations, I'm especially good with visual content. Upload an image to see my vision capabilities!",
            
            "document-assistant": f"📄 **Document Assistant Response**: {message.content}\n\nI can help with that! I'm specialized in document analysis. Upload a document for in-depth analysis, or ask me about document-related tasks."
        }
        
        response = profile_responses.get(current_profile, f"I received: {message.content}")
    
    await cl.Message(
        content=response,
        author="Assistant"
    ).send()