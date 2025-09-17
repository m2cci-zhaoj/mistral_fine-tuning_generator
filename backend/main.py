from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import httpx
import asyncio

app = FastAPI(title="Literary Text Generator API")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"
                "http://localhost:8080" ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="输入文本")
    temperature: Optional[float] = Field(0.7, ge=0.1, le=1.0, description="生成温度")
    max_tokens: Optional[int] = Field(350, ge=50, le=1000, description="最大token数")
    model: Optional[str] = Field("mistral-7b", description="模型名称")
    
    # LoRA参数
    lora_r: Optional[int] = Field(12, ge=1, le=64, description="LoRA rank")
    lora_alpha: Optional[int] = Field(16, ge=1, le=128, description="LoRA alpha")
    lora_dropout: Optional[float] = Field(0.1, ge=0.0, le=0.5, description="LoRA dropout")
    target_modules: Optional[List[str]] = Field(
        default=["query", "key", "value"], 
        description="LoRA目标模块"
    )

class GenerateResponse(BaseModel):
    generated_text: str
    status: str
    model_config: dict = None

# Colab API配置
COLAB_API_URL = None  # 待设置，格式如: "https://xxxxx.ngrok.io/generate"

@app.get("/")
async def root():
    return {"message": "Literary Text Generator API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "colab_connected": COLAB_API_URL is not None,
        "services": ["frontend", "fastapi", "colab"]
    }

@app.post("/api/set-colab-url")
async def set_colab_url(url: str):
    """设置Colab API URL"""
    global COLAB_API_URL
    COLAB_API_URL = url.rstrip('/')
    return {"message": f"Colab URL设置为: {COLAB_API_URL}", "status": "success"}

@app.post("/api/generate", response_model=GenerateResponse)
async def generate_text(request: GenerateRequest):
    print(f"收到生成请求: {request.model_dump()}")
    
    # 如果没有连接Colab，返回Mock数据
    if not COLAB_API_URL:
        mock_response = f"""基于输入文本生成的模拟结果：
原文: "{request.text[:100]}..."
使用模型: {request.model}
LoRA配置: r={request.lora_r}, alpha={request.lora_alpha}, dropout={request.lora_dropout}
目标模块: {request.target_modules}
生成参数: temperature={request.temperature}, max_tokens={request.max_tokens}

[这是模拟输出，请连接Colab获取真实结果]"""
        
        return GenerateResponse(
            generated_text=mock_response,
            status="mock_success",
            model_config={
                "lora_r": request.lora_r,
                "lora_alpha": request.lora_alpha,
                "lora_dropout": request.lora_dropout,
                "target_modules": request.target_modules
            }
        )
    
    # 准备发送给Colab的数据
    colab_payload = {
        "text": request.text,
        "temperature": request.temperature,
        "max_tokens": request.max_tokens,
        "model": request.model,
        "lora_config": {
            "r": request.lora_r,
            "lora_alpha": request.lora_alpha,
            "lora_dropout": request.lora_dropout,
            "target_modules": request.target_modules
        }
    }
    
    try:
        # 发送请求到Colab
        async with httpx.AsyncClient(timeout=30.0) as client:
            print(f"发送请求到Colab: {COLAB_API_URL}/generate")
            response = await client.post(
                f"{COLAB_API_URL}/generate",
                json=colab_payload
            )
            response.raise_for_status()
            result = response.json()
        
        return GenerateResponse(
            generated_text=result.get("generated_text", "生成失败"),
            status="success",
            model_config=colab_payload["lora_config"]
        )
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Colab服务响应超时")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"无法连接Colab服务: {str(e)}")
    except Exception as e:
        print(f"生成错误: {e}")
        raise HTTPException(status_code=500, detail=f"文本生成失败: {str(e)}")

@app.get("/api/test-colab")
async def test_colab_connection():
    """测试Colab连接"""
    if not COLAB_API_URL:
        return {"status": "error", "message": "Colab URL未设置"}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{COLAB_API_URL}/health")
            return {"status": "connected", "colab_status": response.json()}
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("启动FastAPI服务...")
    print("访问 http://localhost:8888/docs 查看API文档")
    uvicorn.run(app, host="0.0.0.0", port=8888)