from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
import uuid
import json
from datetime import datetime
from ..database import get_db
from ..models.script import Script, ScriptCreate
from ..models.db_models import ScriptModel
from ..services.pdf_parser import PDFParserService

router = APIRouter(prefix="/scripts", tags=["scripts"])

# PDFライブラリの保存ディレクトリ
PDF_LIBRARY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "pdf_library")
PDF_METADATA_FILE = os.path.join(PDF_LIBRARY_DIR, "metadata.json")
os.makedirs(PDF_LIBRARY_DIR, exist_ok=True)

def _load_metadata() -> list:
    if os.path.exists(PDF_METADATA_FILE):
        with open(PDF_METADATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def _save_metadata(data: list):
    with open(PDF_METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@router.post("/", response_model=Script)
async def create_script(script_in: ScriptCreate, db: Session = Depends(get_db)) -> Script:
    db_script = ScriptModel(
        title=script_in.title,
        content=script_in.content
    )
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    return db_script

@router.get("/", response_model=List[Script])
async def get_scripts(db: Session = Depends(get_db)) -> List[Script]:
    return db.query(ScriptModel).all()

@router.get("/{script_id}", response_model=Script)
async def get_script(script_id: str, db: Session = Depends(get_db)) -> Script:
    script = db.query(ScriptModel).filter(ScriptModel.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return script

@router.post("/upload-pdf", response_model=List[dict])
async def upload_pdf(file: UploadFile = File(...)):
    """PDFをAI解析して台本データとして返す（一時利用）。"""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDFファイルのみ受け付けています。")
    temp_path = f"temp_{uuid.uuid4()}.pdf"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        raw_text = PDFParserService.extract_text_from_pdf(temp_path)
        parsed_lines = PDFParserService.parse_script_with_ai(raw_text)
        return parsed_lines
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

