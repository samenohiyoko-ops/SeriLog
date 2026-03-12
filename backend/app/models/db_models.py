from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey
import uuid
from datetime import datetime
from ..database import Base

class ScriptModel(Base):
    """
    台本をデータベースに保存するためのSQLAlchemyモデル。
    """
    __tablename__ = "scripts"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
