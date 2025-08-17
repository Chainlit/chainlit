import argparse
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import create_react_agent
from rich.console import Console
from rich.markdown import Markdown
from state import CustomState

from tools import (
    dwg_converter_tool,
    semantic_search_tool,
    code_generator_tool,
    code_executor_tool,
    geometry_description_tool
)
from tools.s3_utils import is_s3_file_reference, download_s3_file_for_processing

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2
)

# Create geometry agent globally
geometry_agent = create_react_agent(
    llm,
    tools=[
        dwg_converter_tool,
        semantic_search_tool,
        code_generator_tool,
        code_executor_tool,
        geometry_description_tool
    ],
    state_schema=CustomState,
    prompt=(
        f"""
        =====================================================================================================================
        Agent Identity and Core Function
        You are GeometryCAD AI for structural engineering, a specialized agent designed to interpret text descriptions,
        DWG files, DXF files, and images to generate precise FreeCAD Python code that creates 3D models of building structures
        exportable to VTP and STL formats. Your primary mission is to bridge the gap between various geometric representations
        and executable 3D modeling code, ensuring accuracy and efficiency.
        ======================================================================================================================
        Core Expertise Areas
        1. Natural language geometric interpretation and dimensional parsing
        2. DWG/DXF file processing and entity extraction
        3. FreeCAD Python API mastery and parametric design
        4. Construction-ready 3D structural model generation
        5. File format conversion and optimization (VTP/STL export)
        ======================================================================================================================
        Input format priority
        1. First prioritize the information given to you in the form of text inputs or user prompt (priority 1)
        2. Next prioritize the Dxf and Dwg file information given you if applicable as user prompt(priority 2)
        3. Next prioritize images given to you as inputs as user prompts (priority 3)
        4. Combine these priorities where more than one is available to you.

        NB: Follow these priorities strictly.
        ======================================================================================================================
        If you encounter file_path: in user prompt and it's with .dwg extension
        - Use dwg_converter_tool with parameter: file_path
        - Use geometry_description_tool with user prompt and the dxf file path returned by dwg_converter_tool.
        - Use semantic_search_tool with geometry description string as parameter,
            returned by geometry_description_tool
        - Use code_generator_tool with the following params:
            geometry_description: returned by geometry_description_tool,
            previous_code: previously generated code if code_executor_tool failed (empty otherwise),
            previous_error: error from code_executor_tool if code_executor_tool failed (empty otherwise)
        - Use code_executor_tool with code generated in previous step and return to user.
        - If previous step fails, run code_generator_tool
            again (max 3 times) as before, but update last 2 params with latest generated code
            from code_generator_tool and error from code_executor_tool.
        FOR GENERAL QUESTIONS (no file):
        - Use semantic_search_tool with the user prompt
        - Use code_generator_tool with the following params:
            geometry_description: user prompt,
            previous_code: previously generated code if code_executor_tool failed (empty otherwise),
            previous_error: error from code_executor_tool if code_executor_tool failed (empty otherwise)
        - Use code_executor_tool with code generated in previous step and return to user.
        - If previous step fails, run code_generator_tool again (max 3 times)
            as before, but update last 2 params with latest generated code
            from code_generator_tool and error from code_executor_tool.
        ==================================================================================================================
        Mission critical guidelines
            a. Code Quality Standards:
                1. Generate parametric models with easily modifiable parameters
                2. Include comprehensive error handling and validation
                3. Maintain geometric accuracy within 1e-6 tolerance
                4. Document all operations with clear comments
                5. Support both metric and imperial units with automatic conversion
            b. Output quality standard
                Your goal is to create production-ready FreeCAD Python code that accurately interprets input data and 
                generates 3D models of building structures. Always prioritize geometric accuracy and perfect alignment.
                Only show beams, columns and slabs and do not show any walls, windows etc.
                Make sure the beams, columns and slabs perfectly flush together such that there are no hanging elements.
        ==================================================================================================================

        """
    ),
)

def geometry_processor(state: CustomState) -> CustomState:
    latest_message = state["messages"][-1] if state["messages"] else None

    if latest_message and hasattr(latest_message, 'content') and is_s3_file_reference(latest_message.content):

        local_file_path = download_s3_file_for_processing(latest_message.content)

        if local_file_path:
            # Pass the local file path to the agent, preserving the original prompt
            new_content = f"{str(latest_message.content)} file_path: {local_file_path}"

            # Create modified state with the new content
            modified_messages = state["messages"][:-1] + [
                HumanMessage(content=new_content)
            ]
            state = {**state, "messages": modified_messages}

    # Invoke the agent (with potentially modified state)
    result = geometry_agent.invoke(state)
    return {
        "messages": [
            HumanMessage(content=result["messages"][-1].content)
        ]
    }

graph_builder = StateGraph(CustomState)
graph_builder.add_node(geometry_processor)
graph_builder.add_edge(START, "geometry_processor")
graph_builder.add_edge("geometry_processor", END)
main_graph = graph_builder.compile(debug=True)

from rich.console import Console
from rich.markdown import Markdown
import chainlit as cl
from typing import Dict, Optional
from chainlit.types import ThreadDict

@cl.on_chat_resume
async def resume(thread: ThreadDict):
    pass

@cl.on_message
async def handle_message(message: cl.Message):
    state = cl.user_session.get("agent_state", {"messages": []})

    user_prompt = message.content
    state["messages"].append(("user", user_prompt))
    console = Console()

    for s in main_graph.stream(
        {"messages": state["messages"]},
        {"recursion_limit": 15},
    ):
        partial_output = s["geometry_processor"]["messages"][-1].content
        # append the agent's partial output to preserve the conversation
        state["messages"].append(("assistant", partial_output))
        await cl.Message(content=partial_output).send()

    cl.user_session.set("agent_state", state)

