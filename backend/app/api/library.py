"""PDFライブラリの永続保存・取得・削除・メモ管理APIルーター"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel
import os
import uuid
import json
from datetime import datetime

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

router = APIRouter(prefix="/scripts/library", tags=["library"])

# メタデータ保存先（※現状はDB未移行のためローカルにjsonでメモなどを管理）
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


class NoteUpdate(BaseModel):
    note: str


@router.post("/save")
async def save_pdf(file: UploadFile = File(...)):
    """PDFをライブラリに永続保存する。"""
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDFファイルのみ受け付けています。")

    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase is not configured.")

    file_id = str(uuid.uuid4())
    original_name = file.filename
    object_name = f"{file_id}.pdf"

    # ファイルをメモリに読み込み、Supabase Storage (pdfs bucket) にアップロード
    file_bytes = await file.read()
    res = supabase.storage.from_("pdfs").upload(object_name, file_bytes, {"content-type": "application/pdf"})
    
    # パブリックURLを取得
    public_url = supabase.storage.from_("pdfs").get_public_url(object_name)

    metadata = _load_metadata()
    entry = {
        "id": file_id,
        "name": original_name,
        "saved_at": datetime.now().isoformat(),
        "path": public_url,  # ローカルパスではなくPublic URLを保存
        "note": "",
    }
    metadata.append(entry)
    _save_metadata(metadata)

    return {"id": file_id, "name": original_name, "saved_at": entry["saved_at"]}


@router.get("/list")
async def list_pdfs():
    """保存済みPDF一覧を返す。"""
    metadata = _load_metadata()
    # クラウド対応のため、pathに "http" が含まれていれば存在チェックをスキップするか、そのまま返す
    valid_metadata = []
    for m in metadata:
        if m.get("path", "").startswith("http") or os.path.exists(m.get("path", "")):
            valid_metadata.append(m)
    return valid_metadata


@router.get("/{file_id}/note")
async def get_note(file_id: str):
    """台本のメモを取得する。"""
    metadata = _load_metadata()
    entry = next((m for m in metadata if m["id"] == file_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="PDFが見つかりません。")
    return {"id": file_id, "note": entry.get("note", "")}


@router.put("/{file_id}/note")
async def update_note(file_id: str, body: NoteUpdate):
    """台本ごとのメモを保存する。"""
    metadata = _load_metadata()
    entry = next((m for m in metadata if m["id"] == file_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="PDFが見つかりません。")
    entry["note"] = body.note
    _save_metadata(metadata)
    return {"id": file_id, "note": body.note}


@router.get("/{file_id}")
async def get_pdf(file_id: str):
    """保存済みPDFファイルを配信する。"""
    metadata = _load_metadata()
    entry = next((m for m in metadata if m["id"] == file_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="PDFが見つかりません。")
        
    path = entry.get("path", "")
    if path.startswith("http"):
        # Supabase Storage などのパブリックURLである場合リダイレクト
        return RedirectResponse(path)
        
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="PDFが見つかりません。")
        
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=entry["name"],
    )


@router.delete("/{file_id}")
async def delete_pdf(file_id: str):
    """保存済みPDFをライブラリから削除する。"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase is not configured.")

    metadata = _load_metadata()
    entry = next((m for m in metadata if m["id"] == file_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="PDFが見つかりません。")
        
    path = entry.get("path", "")
    if path.startswith("http"):
        # Supabase Storage から削除
        object_name = f"{file_id}.pdf"
        supabase.storage.from_("pdfs").remove([object_name])
    else:
        if os.path.exists(path):
            os.remove(path)
            
    _save_metadata([m for m in metadata if m["id"] != file_id])
    return {"message": "削除しました。"}


# --- PDF画像変換ヘルパー ---

async def _get_pdf_bytes(file_id: str) -> bytes:
    """file_idに対応するPDFをbytesで取得する共通処理"""
    import httpx
    metadata = _load_metadata()
    entry = next((m for m in metadata if m["id"] == file_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="PDFが見つかりません。")
    path = entry.get("path", "")
    if path.startswith("http"):
        async with httpx.AsyncClient() as client:
            r = await client.get(path)
            r.raise_for_status()
            return r.content
    elif os.path.exists(path):
        with open(path, "rb") as f:
            return f.read()
    raise HTTPException(status_code=404, detail="PDFファイルが見つかりません。")


@router.get("/{file_id}/pages")
async def get_page_count(file_id: str):
    """PDFの総ページ数を返す。"""
    import fitz
    try:
        pdf_bytes = await _get_pdf_bytes(file_id)
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        count = doc.page_count
        doc.close()
        return {"page_count": count}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF解析エラー: {e}")


@router.get("/{file_id}/page/{page_num}")
async def get_page_image(file_id: str, page_num: int, scale: float = 2.0):
    """指定ページをPNG画像として返す（page_numは1始まり）。"""
    import fitz
    from fastapi.responses import Response
    try:
        pdf_bytes = await _get_pdf_bytes(file_id)
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        if page_num < 1 or page_num > doc.page_count:
            raise HTTPException(status_code=404, detail="ページが存在しません。")
        page = doc.load_page(page_num - 1)
        mat = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")
        doc.close()
        return Response(content=img_bytes, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF変換エラー: {e}")
