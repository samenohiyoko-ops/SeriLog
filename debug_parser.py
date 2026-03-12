import sys
import os
from dotenv import load_dotenv

# プロキシ用パス追加
sys.path.append(os.path.abspath("backend"))

# .envの読み込み（backendディレクトリから）
load_dotenv("backend/.env")

from app.services.pdf_parser import PDFParserService

def test_parse():
    pdf_path = "test_script.pdf"
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found.")
        return
        
    print(f"Testing PDF: {pdf_path}")
    text = PDFParserService.extract_text_from_pdf(pdf_path)
    print("\n--- Raw Extract ---")
    print(repr(text))
    
    parsed = PDFParserService.parse_script_with_ai(text)
    print("\n--- Parsed Result ---")
    for i, line in enumerate(parsed):
        print(f"{i}: [{line['role']}] {line['text']}")

if __name__ == "__main__":
    test_parse()
