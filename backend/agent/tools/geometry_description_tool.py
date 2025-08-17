import pathlib
from .dxf_descriptor import DXFGeometryDescriptor
from langchain.tools import tool
from langchain_openai import ChatOpenAI

@tool
def geometry_description_tool(dxf_path: str, user_prompt: str = "") -> str:
    """
    Generates a contextual text description of the geometry contained in a DXF file,
    enhanced with user prompt context using an LLM.

    Args:
        dxf_path: The absolute path to the DXF file.
        user_prompt: The user's prompt or context to help describe the geometry.

    Returns:
        The enhanced geometry description.
    """
    descriptor = DXFGeometryDescriptor(dxf_path)
    raw_geometry_description = descriptor.generate_description()

    if not user_prompt.strip():
        return raw_geometry_description

    llm = ChatOpenAI(model="gpt-4o", temperature=0)

    prompt = f"""Based on the technical geometry data from a DXF file and the
    user's context, provide a clear and relevant description of the geometry.

    Technical DXF Analysis:
    {raw_geometry_description}

    User Context:
    {user_prompt}
    """

    response = llm.invoke(prompt)
    return response.content

