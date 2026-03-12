from dotenv import load_dotenv
import os

# 環境変数の読み込み
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import scripts, practice, ai, library
from .database import engine, Base

# テーブルの作成（DB接続失敗時もサーバーを起動できるように例外をキャッチ）
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")
except Exception as e:
    print(f"Warning: Could not create database tables: {e}")
    print("Server will start without DB connection. Some features may be unavailable.")

def create_app() -> FastAPI:
    """
    FastAPIアプリケーションのインスタンスを作成し、設定を行う。

    Returns:
        FastAPI: 設定済みのFastAPIアプリケーションインスタンス。
    """
    print("Initializing ActMaster API with CORS allowing all origins...")
    app = FastAPI(
        title="ActMaster API",
        description="演技練習Webアプリ「ActMaster」のバックエンドAPI",
        version="0.1.0",
    )

    # CORSの設定
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(scripts.router)
    app.include_router(library.router)
    app.include_router(practice.router)
    app.include_router(ai.router)

    @app.get("/")
    async def root() -> dict[str, str]:
        """
        ルートエンドポイント。動作確認用。

        Returns:
            dict[str, str]: 歓迎メッセージを含む辞書。
        """
        return {"message": "Welcome to ActMaster API", "port": "8001"}

    return app

app: FastAPI = create_app()
