from typing import List, Dict
import random
try:
    from .practice_data import PRACTICE_SCRIPTS
except ImportError:
    # 開発用フォールバック
    PRACTICE_SCRIPTS = {"error": ["データ読み込み失敗"]}

class PracticeService:
    @staticmethod
    def get_genres() -> List[str]:
        return list(PRACTICE_SCRIPTS.keys())

    @staticmethod
    def get_random_script(genre: str) -> str:
        scripts = PRACTICE_SCRIPTS.get(genre, [])
        if not scripts:
            return "セリフが見つかりません。"
        return random.choice(scripts)
