import os
import requests
from typing import Optional
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None

@router.post("/chat")
async def chat(request: ChatRequest):
    user_message = request.message
    context = request.context or {}
    
    if not OPENROUTER_API_KEY:
        return {"reply": "Sorry, AI is not available right now."}

    user_name = context.get("userName", "User")
    system_prompt = f"You are a professional nutritionist. You are talking to {user_name}. Give diet, health, and meal advice."

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    body = {
        "model": "openai/gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_message
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=body)
        data = response.json()
        
        if "choices" in data and len(data["choices"]) > 0:
            reply = data["choices"][0]["message"]["content"]
            return {"reply": reply}
        else:
            return {"reply": "Sorry, AI is not available right now."}
            
    except Exception as e:
        return {"reply": "Sorry, AI is not available right now."}
