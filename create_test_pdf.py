from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import os

def create_test_pdf(filename):
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4
    
    text = [
        "佐藤：おはよう。今日もいい天気だね。",
        "鈴木：そうですね。絶好の練習日和です。",
        "佐藤：さっそく、昨日の続きからやってみようか。",
        "鈴木：はい、いつでも準備できています！"
    ]
    
    y = height - 100
    for line in text:
        c.drawString(100, y, line)
        y -= 20
        
    c.save()
    print(f"Created: {filename}")

if __name__ == "__main__":
    # reportlab がない場合はインストールしてから実行
    try:
        import reportlab
    except ImportError:
        import subprocess
        subprocess.run(["pip", "install", "reportlab"])
        
    create_test_pdf("test_script.pdf")
