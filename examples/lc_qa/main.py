from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain.chains import VectorDBQAWithSourcesChain
from langchain.chat_models import ChatOpenAI
from langchain.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from chainlit import send_text_document, langchain_factory, langchain_postprocess

with open('./state_of_the_union.txt') as f:
    state_of_the_union = f.read()

text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
texts = text_splitter.split_text(state_of_the_union)

embeddings = OpenAIEmbeddings()

metadatas = [{"source": f"{i}-pl"} for i in range(len(texts))]
docsearch = Chroma.from_texts(texts, embeddings, metadatas=metadatas)

system_template = """Use the following pieces of context to answer the users question. 
If you don't know the answer, just say that you don't know, don't try to make up an answer.
ALWAYS return a "SOURCES" part in your answer.
The "SOURCES" part should be a reference to the source of the document from which you got your answer.

Example of your response should be:

```
The answer is foo
SOURCES: xyz
```

Begin!
----------------
{summaries}"""
messages = [
    SystemMessagePromptTemplate.from_template(system_template),
    HumanMessagePromptTemplate.from_template("{question}")
]
prompt = ChatPromptTemplate.from_messages(messages)
chain_type_kwargs = {"prompt": prompt}

@langchain_factory
def load():
    chain = VectorDBQAWithSourcesChain.from_chain_type(
        ChatOpenAI(temperature=0),
        chain_type="stuff",
        vectorstore=docsearch,
        chain_type_kwargs=chain_type_kwargs,
    )
    return chain


@langchain_postprocess
def process_response(res):
    output = res["answer"]
    sources = res["sources"]
    if sources:
        # Add the sources to the message
        output += f"\nSources: {sources}"
        for source in sources.split(","):
            name = source.strip()
            index = [m["source"] for m in metadatas].index(name)
            # Send the source document referenced in the message
            send_text_document(text=texts[index], name=name)
    return output