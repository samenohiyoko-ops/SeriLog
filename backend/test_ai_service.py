import os
from dotenv import load_dotenv
load_dotenv()

from app.services.ai_service import AIService

def test_ai():
    service = AIService()
    print("Testing TTS...")
    try:
        content = service.generate_speech("テストです")
        print(f"TTS Success: {len(content)} bytes")
    except Exception as e:
        print(f"TTS Error: {e}")

    print("\nTesting Advice...")
    try:
        advice = service.get_acting_advice("テストのセリフです", "テスト")
        print(f"Advice Success: {advice[:50]}...")
    except Exception as e:
        print(f"Advice Error: {e}")

if __name__ == "__main__":
    test_ai()
