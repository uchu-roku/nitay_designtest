"""
森林調査簿コード.xlsxから市町村コードと市町村名を抽出してJSONファイルを作成
"""
import pandas as pd
import json
from pathlib import Path

# Excelファイルを読み込み
excel_path = Path(__file__).parent / "data" / "administrative" / "rinsyousigen" / "森林調査簿コード.xlsx"
df = pd.read_excel(excel_path, header=1)

# 必要なカラムのみ抽出
df = df[['振興局', '市町村', '市町村コード']].copy()

# 最初の行（ヘッダー行）を削除
df = df[df['市町村コード'] != '市町村コード']

# 欠損値を除外
df = df.dropna(subset=['市町村コード', '市町村'])

# 市町村コードを2桁の文字列に変換
df['市町村コード'] = df['市町村コード'].astype(int).astype(str).str.zfill(2)

# 市町村コード→市町村名の辞書を作成（重複を除く）
municipality_dict = {}
for _, row in df.iterrows():
    code = row['市町村コード']
    name = row['市町村']
    if pd.notna(name) and code not in municipality_dict:
        municipality_dict[code] = name

# ソート
municipality_dict = dict(sorted(municipality_dict.items()))

# JSONファイルに保存
output_path = Path(__file__).parent / "data" / "administrative" / "rinsyousigen" / "municipality_codes.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(municipality_dict, f, ensure_ascii=False, indent=2)

print(f"市町村コードマスターデータを作成しました: {output_path}")
print(f"市町村数: {len(municipality_dict)}")
print("\n最初の20件:")
for i, (code, name) in enumerate(list(municipality_dict.items())[:20]):
    print(f"  {code}: {name}")
