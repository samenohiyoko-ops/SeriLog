import fitz  # PyMuPDF
from typing import List

class PDFParserService:
    """
    PDFファイルからテキストを抽出し、台本として解析するためのサービスクラス。
    """
    
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """
        指定されたPDFファイルから全テキストを抽出する。
        縦書き台本に対応するため、座標情報を解析して人間が読む順序（右から左、上から下）に再構成する。
        """
        try:
            doc = fitz.open(file_path)
            full_text = ""
            
            for page in doc:
                # ページ内のテキストをスパン単位で取得
                # "blocks" -> "lines" -> "spans"
                blocks = page.get_text("dict")["blocks"]
                spans = []
                for b in blocks:
                    if "lines" in b:
                        for l in b["lines"]:
                            for s in l["spans"]:
                                spans.append(s)
                
                if not spans:
                    continue
                
                # 日本語の縦書きPDF抽出では、一文字ずつバラバラになることが多い。
                # X座標(右から左)でグループ化し、その中でY座標(上から下)でソートする。
                # 許容範囲を少し広め(15)に設定して「同じ行(列)」として扱う。
                tolerance = 15
                
                # 1. まず全ての文字(span)を座標ベースでソート
                # 縦書き読み順: Xが大きい順 -> Yが小さい順
                spans.sort(key=lambda s: (-s['bbox'][0], s['bbox'][1]))
                
                page_text = ""
                last_s = None
                
                for s in spans:
                    if last_s:
                        dx = abs(s['bbox'][0] - last_s['bbox'][0])
                        dy = s['bbox'][1] - last_s['bbox'][3] # 前の文字の下端と今の文字の上端の差
                        
                        # 縦書きの結合条件: 同一列(dxが小さい) かつ 上下に近い(dyが小さい)
                        # 実データの挙動に合わせて微調整: dx < 10, dy < 15
                        if dx < 10:
                            if dy > 20: # 明らかに間隔が開いている場合は改行
                                page_text += " "
                        else:
                            # 列が変わった
                            page_text += "\n"
                    
                    page_text += s['text']
                    last_s = s
                
                full_text += page_text + "\n\n"
            
            doc.close()
            # デバッグ用に構成後のテキストを表示
            print(f"--- Reconstructed Text ---\n{full_text[:1000]}\n--- End ---")
            return full_text
        except Exception as e:
            print(f"PDF extraction error: {e}")
            raise Exception(f"PDFからのテキスト抽出に失敗しました: {str(e)}")

    @staticmethod
    def parse_script_with_ai(file_path: str) -> List[dict]:
        """
        抽出されたテキストを OpenAI GPT-4o を使用して解析し、役名とセリフのリストに変換する。
        """
        import os
        import json
        from openai import OpenAI
        
        # 1. まずテキストを抽出
        text = PDFParserService.extract_text_from_pdf(file_path)
        if not text.strip():
            return []

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return PDFParserService._simple_parse(text)
            
        try:
            client = OpenAI(api_key=api_key)
            prompt = """
あなたはプロの台本解析エディターです。
入力されたテキストは、縦書きPDFから抽出された不完全な（1文字ずつバラバラになった）日本語の断片です。

【あなたの任務】
1. **文脈復元**: 断片的な文字をつなぎ合わせ、意味の通じる自然な日本語のセリフやト書きに復元してください。
   例：「佐藤」「こ」「ん」「に」「ち」「は」 → 佐藤：こんにちは
2. **構造化**: 修正したテキストを「役名」と「セリフ」に分類し、JSON形式で出力してください。
3. **ト書きの分離**: シーン説明、柱、演出指示などは role: "ト書き/ナレーション" としてください。

【出力形式】
必ず以下の構造のJSONオブジェクトを返してください：
{
  "script_lines": [
    {"role": "役名", "text": "校正・復元後の自然な日本語テキスト"},
    ...
  ]
}
"""
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"以下の断片的な日本語テキストを解析・復元し、台本に変換してください：\n\n{text}"}
                ],
                response_format={ "type": "json_object" }
            )
            
            res_content = response.choices[0].message.content
            print(f"AI Response: {res_content[:500]}...")
            
            content = json.loads(res_content)
            for key in ["script_lines", "script", "lines"]:
                if key in content and isinstance(content[key], list):
                    return content[key]
            return []
            
        except Exception as e:
            print(f"AI parsing error: {e}")
            return PDFParserService._simple_parse(text)

    @staticmethod
    def _simple_parse(text: str) -> List[dict]:
        """
        AIが使えない場合のフォールバック解析ロジック。
        """
        lines = []
        raw_lines = [l.strip() for l in text.split("\n") if l.strip()]
        for raw_line in raw_lines:
            separators = ["：", ":", " :", " ："]
            found_sep = None
            for sep in separators:
                if sep in raw_line:
                    found_sep = sep
                    break
            if found_sep:
                parts = raw_line.split(found_sep, 1)
                lines.append({"role": parts[0].strip(), "text": parts[1].strip()})
            else:
                if lines:
                    lines[-1]["text"] += " " + raw_line
                else:
                    lines.append({"role": "ト書き/ナレーション", "text": raw_line})
        return lines
