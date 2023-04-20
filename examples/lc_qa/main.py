from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQAWithSourcesChain
from langchain.chat_models import ChatOpenAI
from langchain.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
import chainlit as cl


text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)

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


@cl.langchain_factory
def init():
    file = None

    # Wait for the user to upload a file
    while file == None:
        file = cl.ask_for_file(
            title="Please upload a text file to begin!", accept=["text/plain"])

    # Decode the file
    text = file.content.decode("utf-8")

    # Split the text into chunks
    texts = text_splitter.split_text(text)

    # Create a metadata for each chunk
    metadatas = [{"source": f"{i}-pl"} for i in range(len(texts))]

    # Create a Chroma vector store
    embeddings = OpenAIEmbeddings()
    docsearch = Chroma.from_texts(texts, embeddings, metadatas=metadatas)

    # Create a chain that uses the Chroma vector store
    chain = RetrievalQAWithSourcesChain.from_chain_type(ChatOpenAI(
        temperature=0), chain_type="stuff", retriever=docsearch.as_retriever())

    # Save the metadata and texts in the user session
    cl.user_session.set("metadatas", metadatas)
    cl.user_session.set("texts", texts)

    # Let the user know that the system is ready
    cl.send_message(f"`{file.name}` uploaded, you can now ask questions!")

    return chain


@cl.langchain_postprocess
def process_response(res):
    answer = res["answer"]
    sources = res["sources"]

    # Get the metadata and texts from the user session
    metadatas = cl.user_session.get("metadatas")
    texts = cl.user_session.get("texts")

    if sources:
        # Add the sources to the message
        answer += f"\nSources: {sources}"
        # Add the sources to the message
        for source in sources.split(","):
            name = source.strip()
            # Get the index of the source document
            index = [m["source"] for m in metadatas].index(name)
            text = texts[index]
            # Send the source document referenced in the message
            cl.send_text_document(text=text, name=name)

    return answer
