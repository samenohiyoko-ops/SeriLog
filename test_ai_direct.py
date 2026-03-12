import sys
import os
from dotenv import load_dotenv

# プロキシ用パス追加
sys.path.append(os.path.abspath("backend"))
load_dotenv("backend/.env")

from app.services.pdf_parser import PDFParserService

def test_ai_formats():
    test_text = """
【第一幕：再会】
佐藤「ようやく会えたな、鈴木」
（鈴木、少し戸惑いながら）
鈴木：ああ。久しぶりだな。
佐藤 (笑いながら) 「相変わらずだな、お前は」

[縦書き抽出の再現：一文字ずつ改行されているケース]
田
中
「
ん
な
バ
カ
な
！
」
"""
    print(f"Testing AI with complex formats:\n{test_text}")
    
    try:
        parsed = PDFParserService.parse_script_with_ai(test_text)
        print("\n--- Parsed Result ---")
        if not parsed:
            print("No lines extracted.")
        for i, line in enumerate(parsed):
            print(f"{i}: [{line.get('role', 'N/A')}] {line.get('text', 'N/A')}")
    except Exception as e:
        print(f"Error during AI test: {e}")

if __name__ == "__main__":
    test_ai_formats()
