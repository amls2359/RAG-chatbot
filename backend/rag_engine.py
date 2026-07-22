import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain

# In-memory store of vector DBs per session (simple approach for a portfolio project)
vector_stores = {}

# Loaded once and reused across requests. Free, runs locally — no API key needed.
_embeddings = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
)


def process_pdf(file_path: str, session_id: str, original_filename: str = None):
    """Load a PDF, split it into chunks, enrich with metadata, embed, and store in FAISS."""
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150
    )
    chunks = splitter.split_documents(documents)

    # --- Metadata enrichment ---
    # PyPDFLoader already attaches a 0-indexed "page" to each chunk's metadata
    # automatically. We add a few more useful fields on top of that.
    source_name = original_filename or os.path.basename(file_path)

    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = i
        chunk.metadata["source_file"] = source_name
        # PyPDFLoader's "page" is 0-indexed; store a human-friendly 1-indexed version too
        if "page" in chunk.metadata:
            chunk.metadata["page_number"] = chunk.metadata["page"] + 1

    vectorstore = FAISS.from_documents(chunks, _embeddings)

    vector_stores[session_id] = vectorstore
    return len(chunks)


def ask_question(session_id: str, question: str):
    """Retrieve relevant chunks and generate an answer, including source metadata."""
    if session_id not in vector_stores:
        return {"error": "No document uploaded for this session."}

    vectorstore = vector_stores[session_id]
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

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

    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)

    result = rag_chain.invoke({"input": question})

    # --- Enriched sources: now includes page number and filename, not just raw text ---
    sources = [
        {
            "text": doc.page_content[:150],
            "page": doc.metadata.get("page_number", "unknown"),
            "source_file": doc.metadata.get("source_file", "unknown"),
        }
        for doc in result["context"]
    ]

    return {"answer": result["answer"], "sources": sources}