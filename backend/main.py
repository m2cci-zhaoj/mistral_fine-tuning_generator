from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Literary Text Generator API")

class GenerateRequest(BaseModel):
    text: str
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 350

@app.get("/")
async def root():
    return {"message": "Literary Text Generator API is running"}

@app.post("/api/generate")
async def generate_text(request: GenerateRequest):
    mock_response = f"Generated text based on: '{request.text[:50]}...' with temperature {request.temperature}"
    return {"generated_text": mock_response, "status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)