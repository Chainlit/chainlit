from langchain import OpenAI, LLMMathChain, SerpAPIWrapper
from langchain.agents import initialize_agent, Tool
from langchain.chat_models import ChatOpenAI
from chainlit import langchain_factory


@langchain_factory
def load(env):
    llm = ChatOpenAI(temperature=0)
    llm1 = OpenAI(temperature=0)
    search = SerpAPIWrapper()
    llm_math_chain = LLMMathChain(llm=llm1, verbose=True)

    tools = [
        Tool(
            name = "Search",
            func=search.run,
            description="useful for when you need to answer questions about current events. You should ask targeted questions"
        ),
        Tool(
            name="Calculator",
            func=llm_math_chain.run,
            description="useful for when you need to answer questions about math"
        ),
    ]
    return initialize_agent(tools, llm, agent="chat-zero-shot-react-description", verbose=True)
