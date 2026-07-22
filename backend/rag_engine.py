import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

vector_stores = {}

_embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-001",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
)


def process_pdf(file_path: str, session_id: str, original_filename: str = None):
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    chunks = splitter.split_documents(documents)

    source_name = original_filename or os.path.basename(file_path)
    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = i
        chunk.metadata["source_file"] = source_name
        if "page" in chunk.metadata:
            chunk.metadata["page_number"] = chunk.metadata["page"] + 1

    vectorstore = FAISS.from_documents(chunks, _embeddings)
    vector_stores[session_id] = vectorstore
    return len(chunks)


def _format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


def ask_question(session_id: str, question: str):
    if session_id not in vector_stores:
        return {"error": "No document uploaded for this session."}

    vectorstore = vector_stores[session_id]
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

    docs = retriever.invoke(question)
    context = _format_docs(docs)

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0,
    )

    system_prompt = (
        "Use the given context to answer the question. "
        "If you don't know the answer, say you don't know. "
        "Keep the answer concise.\n\nContext: {context}"
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    chain = prompt | llm | StrOutputParser()
    answer = chain.invoke({"context": context, "input": question})

    sources = [
        {
            "text": doc.page_content[:150],
            "page": doc.metadata.get("page_number", "unknown"),
            "source_file": doc.metadata.get("source_file", "unknown"),
        }
        for doc in docs
    ]

    return {"answer": answer, "sources": sources}
