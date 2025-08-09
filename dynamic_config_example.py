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
from chainlit.types import ChatProfile


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
            markdown_description="AI assistant with vision capabilities for image analysis",
            icon="👁️",
        ),
        ChatProfile(
            name="document-assistant",
            markdown_description="Specialized assistant for document processing and analysis",
            icon="📄",
        ),
    ]


@cl.on_profile_switch
async def handle_profile_switch(profile: ChatProfile):
    """Handle profile switching with dynamic configuration updates."""
    
    print(f"🔄 Switching to profile: {profile.name}")
    
    if profile.name == "text-assistant":
        # Text-only profile: disable file uploads, basic UI
        await cl.update_config({
            "features": {
                "spontaneous_file_upload": {
                    "enabled": False
                }
            },
            "ui": {
                "name": "Text Assistant",
                "description": "Your helpful text-only AI assistant"
            }
        })
        
        await cl.Message(
            content="🔧 **Configuration Updated**: Text-only mode enabled. File uploads are disabled for focused text conversations.",
            author="System"
        ).send()
        
    elif profile.name == "vision-assistant":
        # Vision profile: enable image uploads with restrictions
        await cl.update_config({
            "features": {
                "spontaneous_file_upload": {
                    "enabled": True,
                    "accept": ["image/*"],
                    "max_files": 5,
                    "max_size_mb": 10
                }
            },
            "ui": {
                "name": "Vision Assistant",
                "description": "AI assistant with advanced vision capabilities"
            }
        })
        
        await cl.Message(
            content="🔧 **Configuration Updated**: Vision mode enabled! You can now upload images (max 5 files, 10MB each) for analysis.",
            author="System"
        ).send()
        
    elif profile.name == "document-assistant":
        # Document profile: enable document uploads with generous limits
        await cl.update_config({
            "features": {
                "spontaneous_file_upload": {
                    "enabled": True,
                    "accept": [
                        "application/pdf",
                        "application/msword", 
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "text/plain",
                        "text/markdown"
                    ],
                    "max_files": 10,
                    "max_size_mb": 50
                }
            },
            "ui": {
                "name": "Document Assistant",
                "description": "Specialized assistant for document analysis and processing"
            }
        })
        
        await cl.Message(
            content="🔧 **Configuration Updated**: Document mode enabled! You can upload PDFs, Word docs, text files (max 10 files, 50MB each) for analysis.",
            author="System"
        ).send()


@cl.on_chat_start
async def start_chat():
    """Initialize the chat with profile-specific welcome message."""
    
    # Get the current profile from the session
    current_profile = cl.context.session.chat_profile or "text-assistant"
    
    welcome_messages = {
        "text-assistant": "👋 Welcome to **Text Assistant**! I'm here for all your text-based conversations and questions.",
        "vision-assistant": "👁️ Welcome to **Vision Assistant**! Upload images and I'll help you analyze and understand them.",
        "document-assistant": "📄 Welcome to **Document Assistant**! Upload documents and I'll help you analyze, summarize, and extract information."
    }
    
    welcome_message = welcome_messages.get(current_profile, "👋 Welcome! How can I help you today?")
    
    await cl.Message(
        content=welcome_message,
        author="Assistant"
    ).send()


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


if __name__ == "__main__":
    print("🚀 Dynamic Configuration Demo")
    print("📋 Available profiles: text-assistant, vision-assistant, document-assistant")
    print("🔄 Switch profiles to see dynamic configuration changes!")