import sys
import os
sys.path.append(r'c:\Users\hinak\engirennsyuusaityo\backend')
from app.services.pdf_parser import PDFParserService

pdf_path = r'c:\Users\hinak\engirennsyuusaityo\uirouuri-tate.pdf'
out_path = r'c:\Users\hinak\engirennsyuusaityo\backend\temp_uirou.txt'

try:
    text = PDFParserService.extract_text_from_pdf(pdf_path)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Success")
except Exception as e:
    print(f"Error: {e}")
