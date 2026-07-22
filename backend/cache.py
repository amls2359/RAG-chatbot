import os
import json
import hashlib
import redis

r = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True,
)

SESSION_TTL = 3600  # 1 hour

def save_message(session_id: str, role: str, text: str):
    r.rpush(f"chat:{session_id}", json.dumps({"role": role, "text": text}))
    r.expire(f"chat:{session_id}", SESSION_TTL)

def get_history(session_id: str):
    messages = r.lrange(f"chat:{session_id}", 0, -1)
    return [json.loads(m) for m in messages]

def _answer_cache_key(session_id: str, question: str) -> str:
    # Hash the question so cache keys stay short and consistent
    q_hash = hashlib.sha256(question.strip().lower().encode()).hexdigest()
    return f"answer:{session_id}:{q_hash}"

def get_cached_answer(session_id: str, question: str):
    cached = r.get(_answer_cache_key(session_id, question))
    return json.loads(cached) if cached else None

def cache_answer(session_id: str, question: str, answer_data: dict):
    r.set(
        _answer_cache_key(session_id, question),
        json.dumps(answer_data),
        ex=SESSION_TTL,
    )