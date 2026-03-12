import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    """
    ルートエンドポイントが正常なメッセージを返すか確認する。
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to ActMaster API"}

def test_create_script():
    """
    台本の新規作成が正常に行えるか確認する。
    """
    script_data = {
        "title": "テスト台本",
        "content": "A: こんにちは\nB: さようなら"
    }
    response = client.post("/scripts/", json=script_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == script_data["title"]
    assert "id" in data

def test_get_scripts():
    """
    台本一覧が取得できるか確認する。
    """
    response = client.get("/scripts/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_script_not_found():
    """
    存在しないIDを指定した場合に404エラーが返るか確認する。
    """
    import uuid
    random_id = str(uuid.uuid4())
    response = client.get(f"/scripts/{random_id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Script not found"
