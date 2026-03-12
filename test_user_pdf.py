import sys
import os
from dotenv import load_dotenv

# プロキシ用パス追加
sys.path.append(os.path.abspath("backend"))
load_dotenv("backend/.env")

from app.services.pdf_parser import PDFParserService

def test_specific_pdf(file_path):
    print(f"--- Testing PDF: {file_path} ---")
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    try:
        # AI解析 (Vision)
        print("\nStep: Parsing with AI (GPT-4o Vision)...")
        # 新しいシグネチャに合わせて file_path を直接渡す
        parsed = PDFParserService.parse_script_with_ai(file_path)
        
        print("\n--- Parsed Result (First 10 lines) ---")
        if not parsed:
            print("No lines extracted or parsing failed.")
        for i, line in enumerate(parsed[:10]):
            role = line.get('role', 'N/A')
            text = line.get('text', 'N/A')
            print(f"{i+1}: [{role}] {text}")
            
        print(f"\nTotal lines parsed: {len(parsed)}")
        
    except Exception as e:
        print(f"Error during testing: {e}")

if __name__ == "__main__":
    target_pdf = r"c:\Users\hinak\engirennsyuusaityo\「今際の際にプロポーズを」改訂版.pdf"
    test_specific_pdf(target_pdf)
