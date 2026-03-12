from datetime import datetime
from typing import Optional, Union
from uuid import UUID, uuid4
from pydantic import BaseModel, Field

class ScriptBase(BaseModel):
    """
    台本の基本情報を受け取るためのPydanticモデル。
    """
    title: str = Field(..., example="ツンデレな幼馴染との会話")
    content: str = Field(..., description="台本のテキスト内容")

class ScriptCreate(ScriptBase):
    """
    台本作成時に使用するモデル。
    """
    pass

class Script(ScriptBase):
    """
    API応答やデータベース表現に使用する完成した台本モデル。
    """
    id: Union[str, UUID]
    user_id: Optional[Union[str, UUID]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        orm_mode = True
