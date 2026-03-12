from fastapi import APIRouter, HTTPException
from typing import List
from ..services.practice_service import PracticeService

router = APIRouter(prefix="/practice", tags=["practice"])

@router.get("/genres", response_model=List[str])
async def get_genres():
    return PracticeService.get_genres()

@router.get("/random", response_model=dict)
async def get_random_script(genre: str):
    script = PracticeService.get_random_script(genre)
    if not script:
        raise HTTPException(status_code=404, detail="Genre not found")
    return {"genre": genre, "text": script}
