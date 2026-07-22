import os
import uuid
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from rag_engine import process_pdf, ask_question
from cache import save_message, get_history, get_cached_answer, cache_answer

load_dotenv()

app = FastAPI()

# Allow the React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],  # update to match your Vite port
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    session_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{session_id}.pdf")

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Pass the original filename so enriched metadata shows the real name,
    # not the random session_id.pdf name used on disk.
    chunk_count = process_pdf(file_path, session_id, original_filename=file.filename)

    return {
        "session_id": session_id,
        "message": f"Document processed into {chunk_count} chunks.",
    }


@app.post("/chat")
async def chat(session_id: str = Form(...), question: str = Form(...)):
    save_message(session_id, "user", question)

    cached = get_cached_answer(session_id, question)
    if cached:
        save_message(session_id, "bot", cached["answer"])
        return {**cached, "from_cache": True}

    result = ask_question(session_id, question)

    if "answer" in result:
        cache_answer(session_id, question, result)
        save_message(session_id, "bot", result["answer"])

    return {**result, "from_cache": False}


@app.get("/history/{session_id}")
async def chat_history(session_id: str):
    return {"messages": get_history(session_id)}


@app.get("/")
def health_check():
    return {"status": "RAG backend is running"}