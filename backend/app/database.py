from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# 環境変数からDATABASE_URLを取得。なければ開発用のSQLiteを使用
# 環境変数からDATABASE_URLを取得。なければ開発用のSQLiteを使用
raw_url = os.environ.get("DATABASE_URL", "sqlite:///./actmaster.db")

engine_kwargs = {}
# Connection Stringが提供されている場合、psycopg2を用いた安全な接続を構築
if "postgresql://" in raw_url or "postgres://" in raw_url:
    import urllib.parse
    import psycopg2
    
    parsed = urllib.parse.urlparse(raw_url)
    username = urllib.parse.unquote(parsed.username) if parsed.username else ""
    password = urllib.parse.unquote(parsed.password) if parsed.password else ""
    hostname = parsed.hostname
    port = parsed.port or 5432
    database = parsed.path.lstrip("/") if parsed.path else "postgres"
    
    # URL文字列を一切受け取らず、psycopg2.connect を用いた creator 関数により接続を構築
    def get_connection():
        return psycopg2.connect(
            host=hostname,
            port=port,
            user=username,
            password=password,
            dbname=database,
        )
    
    engine = create_engine("postgresql+psycopg2://", creator=get_connection)
    is_sqlite = False
else:
    SQLALCHEMY_DATABASE_URL = raw_url
    is_sqlite = str(raw_url).startswith("sqlite")
    if is_sqlite:
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    データベースセッションを取得し、終了後にクローズするための依存関係提供関数。
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
