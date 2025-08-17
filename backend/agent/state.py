from typing import Optional
from langgraph.prebuilt.chat_agent_executor import AgentState

class CustomState(AgentState):
    semantic_context: Optional[str] = None

