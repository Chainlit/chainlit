from langchain_core.tools import tool, InjectedToolCallId
from langgraph.types import Command
from langchain_core.messages import ToolMessage
from typing import Annotated
from qdrant_client import models, QdrantClient
from sentence_transformers import SentenceTransformer
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@tool
def semantic_search_tool(
    query: str,
    tool_call_id: Annotated[str, InjectedToolCallId]
) -> Command:
    """
    Perform semantic search based on the query.
    
    Args:
        query: The string to search context for
        
    Returns:
        str: Search results and relevant context
    """

    client = QdrantClient(
        url="https://2f0f13ce-26a1-48bc-9f47-7c7af4f4f077.eu-central-1-0.aws.cloud.qdrant.io:6333",
        api_key=os.getenv("QDRANT_API_KEY"),
    )

    encoder = SentenceTransformer("all-MiniLM-L6-v2")

    hits = client.query_points(
        collection_name="bloomcore_buildings",
        query=encoder.encode(query).tolist(),
        limit=4,
    ).points

    context_code = ""
    for hit in hits:
        context_code += "prompt: {}".format(hit.payload['description'])
        context_code += "\n"
        context_code += "============================================="
        context_code += "\n"
        context_code += "Generated FreeCAD python script is " + "\n"
        context_code += "{}".format(hit.payload['script'])
        context_code += "\n"

    return Command(update={
        "semantic_context": context_code,
        "messages": [
            ToolMessage(f"Semantic context {context_code}", tool_call_id=tool_call_id)
        ]
    })

