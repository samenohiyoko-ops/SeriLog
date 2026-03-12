import os
from openai import OpenAI
from typing import Optional

class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def generate_speech(self, text: str, voice: str = "alloy") -> bytes:
        """
        OpenAI TTS APIを使用してテキストを音声に変換する。
        クォータエラー時は例外を投げ、呼び出し側でハンドルする。
        """
        try:
            response = self.client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=text
            )
            return response.content
        except Exception as e:
            print(f"TTS Error: {e}")
            raise e

    def get_acting_advice(self, text: str, genre: str) -> str:
        """
        GPT-4oを使用して、セリフの演技アドバイスを生成する。
        APIが利用できない場合は固定のアドバイスを返す。
        """
        try:
            prompt = f"""
あなたはプロの演技指導者です。以下のセリフ（ジャンル: {genre}）の読み方、感情の込め方、アクセント、間（ま）の取り方について、具体的で前向きなアドバイスを300文字程度で提供してください。

セリフ:
「{text}」

アドバイス:
"""
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "あなたは親切で熱心な演技指導者です。"},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"AI Advice Error: {e}")
            return f"""【AIアドバイス（簡易版）】
現在、AIとの接続が制限されているため、一般的なアドバイスを表示しています。

「{text}」というセリフは、{genre}特有の感情の起伏を意識することが重要です。
1. 語尾のニュアンスを大切にしましょう。
2. セリフの前の「間」を意識して、キャラクターの心情を準備してください。
3. 滑舌に注意し、一音一音を明瞭に発音することから始めましょう。

APIキーの有効期限やクレジット残高を確認することをお勧めします。"""
    def get_accent_info(self, text: str) -> str:
        """
        GPT-4oを使用して、単語や文章の日本語アクセント（標準語基準）を調査する。
        """
        try:
            prompt = f"""
あなたはプロの日本語発音・アクセント指導者です。
以下のテキストについて、NHKアクセント辞典や日本俳優連合の基準に基づいた標準語のアクセント（高低）を詳しく解説してください。

【出力ルール】
1. 各単語について、「高低」を視覚的にわかる形式（例：ア(低)カ(高)イ(高)）で示してください。
2. 特徴的なアクセント（核）がある場合はその理由や注意点を添えてください。
3. 文章の場合は、イントネーション（文末の上げ下げ）についても触れてください。

テキスト:
「{text}」

解説:
"""
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "あなたは精密な日本語アクセント辞典の専門家です。"},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Accent Info Error: {e}")
            return f"""【アクセント情報（簡易解析）】
「{text}」のアクセントを確認してください。
（現在AIとの詳細接続が制限されています）

・単語の頭を高く出すか、低く出すかを確認し、辞書（NHKアクセント辞典等）で「核」の位置をチェックすることをお勧めします。
・一般的な標準語では、一拍目と二拍目で必ず高低が変化します。"""

