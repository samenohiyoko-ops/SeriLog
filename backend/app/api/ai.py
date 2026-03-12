from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from ..services.ai_service import AIService
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["ai"])
ai_service = AIService()

class AdviceRequest(BaseModel):
    text: str
    genre: str

@router.get("/tts")
async def get_tts(text: str = Query(...), voice: str = "alloy"):
    try:
        audio_content = ai_service.generate_speech(text, voice)
        return Response(content=audio_content, media_type="audio/mpeg")
    except Exception as e:
        # クォータエラーなどの場合、フロントエンドでエラー表示するために詳細を返す
        error_msg = str(e)
        if "insufficient_quota" in error_msg:
            raise HTTPException(status_code=402, detail="OpenAI APIの利用枠が不足しています。キーの残高を確認してください。")
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/advice")
async def get_advice(request: AdviceRequest):
    try:
        advice = ai_service.get_acting_advice(request.text, request.genre)
        return {"advice": advice}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
class AccentRequest(BaseModel):
    text: str

@router.post("/accent")
async def get_accent_info(request: AccentRequest):
    try:
        info = ai_service.get_accent_info(request.text)
        return {"info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
