"""
KEYCODEの構造を確認
"""
import pandas as pd
from pathlib import Path

# 調査簿データを読み込み
excel_path = Path(__file__).parent / "data" / "administrative" / "rinsyousigen" / "01渡島_調査簿データ.xlsx"
df = pd.read_excel(excel_path)

print("市町村コードの一覧:")
print(sorted(df['市町村コード'].unique()))

print("\nKEYCODEと市町村コードの対応（最初の20件）:")
for i in range(min(20, len(df))):
    keycode = str(int(df['KEYCODE'].iloc[i])).zfill(14)
    mun_code = str(int(df['市町村コード'].iloc[i])).zfill(2)
    rinban = str(int(df['林班'].iloc[i])).zfill(4)
    syouhan = str(int(df['小班'].iloc[i])).zfill(4)
    
    print(f"KEYCODE: {keycode}")
    print(f"  市町村コード: {mun_code}")
    print(f"  林班: {rinban}")
    print(f"  小班: {syouhan}")
    print(f"  KEYCODEの最初の2桁: {keycode[:2]}")
    print(f"  KEYCODEの3-4桁: {keycode[2:4]}")
    print()
