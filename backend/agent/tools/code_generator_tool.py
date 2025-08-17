from typing import Annotated, Optional
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic
import os
from langgraph.prebuilt import InjectedState
from state import CustomState

@tool
def code_generator_tool(
    state: Annotated[CustomState, InjectedState],
    geometry_description: str,
    previous_code: str = "",
    previous_error: str = ""
) -> str:
    """
    Generate FreeCAD Python code based on geometry description and semantic search context.

    Args:
        geometry_description: Text description from DWG conversion
        previous_code: Previously generated code (if this is a retry)
        previous_error: Error from previous execution attempt

    Returns:
        str: Generated FreeCAD Python code
    """
    # Initialize LLM with higher token limit
    llm = ChatAnthropic(
        model="claude-sonnet-4-20250514",
        temperature=0.1,
        max_tokens=5500,
        timeout=None
    )

    semantic_context = state.get("semantic_context")

    # Create comprehensive prompt with retry context
    retry_context = ""
    if previous_code or previous_error:
        retry_context = f"""
PREVIOUS ATTEMPT INFORMATION:
Previous Code:
{previous_code}

Previous Error:
{previous_error}

Please fix the above error and generate corrected code.
"""

    prompt = f"""
You are an expert FreeCAD Python programmer. Generate complete, working FreeCAD Python code to create 3D geometry based on the provided inputs.

GEOMETRY DESCRIPTION:
Use this structural information when programming the new geometry! It describes what you should actually program.
{geometry_description}

SEMANTIC CONTEXT: Use this as a reference of how to actually program the geometry described above.
{semantic_context}

{retry_context}

REQUIREMENTS:
- Study SEMANTIC CONTEXT carefully and follow its patterns
- Use the same imports, structure, and FreeCAD API patterns shown in the reference
- Include the convert_stl_to_vtp function from the reference (adapt as needed)
- Export to STEP, STL, and VTP files in /output/ directory (mounted from /tmp)

Generate ONLY the complete Python code, no explanations or markdown formatting.
"""

    # Generate code using LLM
    print(f"---PROMPT---\n{prompt}\n---")
    response = llm.invoke(prompt)
    return response.content

