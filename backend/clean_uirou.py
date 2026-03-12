import re

with open(r'c:\Users\hinak\engirennsyuusaityo\backend\temp_uirou.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

clean = []
for l in lines:
    l = l.strip()
    if not l: continue
    if re.search(r'[一-龥、。，．「」『』（）]', l) or 'ヨロオ' in l or 'アワヤ' in l or 'ガラピイ' in l or 'タアプポポ' in l or 'ふた' in l or 'かわらなでしこ' in l or 'ひだこ' in l:
        clean.append(l)

final_text = "\n".join(clean)

# Rewrite practice_data.py
data_path = r'c:\Users\hinak\engirennsyuusaityo\backend\app\services\practice_data.py'
with open(data_path, 'r', encoding='utf-8') as f:
    data_content = f.read()

import json
replacement = '    "外郎売": [\n        ' + json.dumps(final_text, ensure_ascii=False) + '\n    ],'

import re
new_data = re.sub(r'    "外郎売": \[.*?    ],', replacement, data_content, flags=re.DOTALL)

with open(data_path, 'w', encoding='utf-8') as f:
    f.write(new_data)

print("Updated practice_data.py with full Uirouuri text!")
