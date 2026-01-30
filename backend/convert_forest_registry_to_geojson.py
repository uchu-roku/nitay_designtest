"""
Shapefile（小班ポリゴン）+ Excel（調査簿）を統合してGeoJSON + 層索引JSONに変換
KEYCODE（14桁）で紐付け、1対多の層データを保持
コードマスタを使ってコード値を日本語名に変換
"""
import geopandas as gpd
import pandas as pd
import json
import os
from pathlib import Path

def normalize_keycode(val):
    """
    KEYCODEを14桁文字列に正規化
    Excel数値（指数表記や先頭ゼロ欠落）に対応
    """
    if pd.isna(val):
        return None
    try:
        # 数値として読み込まれた場合も対応
        s = str(int(float(val))).strip()
        return s.zfill(14)
    except:
        # 文字列の場合
        s = str(val).strip()
        return s.zfill(14)

def load_code_master(excel_path):
    """
    コードマスタExcelを読み込んで辞書化
    """
    print("コードマスタを読み込み中...")
    
    # Excelファイルを読み込み（ヘッダーなし）
    df = pd.read_excel(excel_path, sheet_name='コード一覧', header=None)
    
    code_masters = {
        '森林の種類': {},
        '林種': {},
        '樹種': {}
    }
    
    # (3) 森林の種類（行14-40付近）
    print("  森林の種類コードを読み込み中...")
    for i in range(14, 40):  # 行14-39に拡張
        if i < len(df):
            code = df.iloc[i, 0]
            name = df.iloc[i, 5]
            if pd.notna(code) and pd.notna(name):
                code_str = str(code).strip()
                name_str = str(name).strip()
                if code_str and name_str:
                    # 数値コードの場合、0埋めなしバージョンも登録
                    code_masters['森林の種類'][code_str] = name_str
                    try:
                        code_no_zero = str(int(float(code_str)))
                        if code_no_zero != code_str:
                            code_masters['森林の種類'][code_no_zero] = name_str
                    except:
                        pass
    
    # (4) 林種（行41-48付近）
    print("  林種コードを読み込み中...")
    for i in range(41, 50):  # 行41-49に拡張
        if i < len(df):
            code = df.iloc[i, 0]
            name = df.iloc[i, 5]
            if pd.notna(code) and pd.notna(name):
                code_str = str(code).strip()
                name_str = str(name).strip()
                if code_str and name_str:
                    # 数値コードの場合、0埋めなしバージョンも登録
                    code_masters['林種'][code_str] = name_str
                    try:
                        code_no_zero = str(int(float(code_str)))
                        if code_no_zero != code_str:
                            code_masters['林種'][code_no_zero] = name_str
                    except:
                        pass
    
    # (5) 樹種（行53-84付近、列0+5と列25+30の2箇所）
    print("  樹種コードを読み込み中...")
    
    # 左側の樹種（列0=コード、列5=名前）
    for i in range(53, 84):  # 行53-83
        if i < len(df):
            code = df.iloc[i, 0]
            name = df.iloc[i, 5]
            if pd.notna(code) and pd.notna(name):
                code_str = str(code).strip()
                name_str = str(name).strip()
                if code_str and name_str and code_str.replace('.', '').isdigit():
                    # 0埋めあり（01, 02）と0埋めなし（1, 2）の両方で登録
                    code_masters['樹種'][code_str] = name_str
                    # 0埋めなしバージョンも登録
                    try:
                        code_no_zero = str(int(float(code_str)))
                        code_masters['樹種'][code_no_zero] = name_str
                    except:
                        pass
    
    # 右側の樹種（列25=コード、列30=名前）
    for i in range(53, 84):  # 行53-83
        if i < len(df) and len(df.columns) > 30:
            code = df.iloc[i, 25]
            name = df.iloc[i, 30]
            if pd.notna(code) and pd.notna(name):
                code_str = str(code).strip()
                name_str = str(name).strip()
                if code_str and name_str and code_str.replace('.', '').isdigit():
                    # 0埋めあり（01, 02）と0埋めなし（1, 2）の両方で登録
                    code_masters['樹種'][code_str] = name_str
                    # 0埋めなしバージョンも登録
                    try:
                        code_no_zero = str(int(float(code_str)))
                        code_masters['樹種'][code_no_zero] = name_str
                    except:
                        pass
    
    print(f"  ✓ 森林の種類: {len(code_masters['森林の種類'])} 件")
    print(f"  ✓ 林種: {len(code_masters['林種'])} 件")
    print(f"  ✓ 樹種: {len(code_masters['樹種'])} 件（0埋めあり/なし両対応、左右両列）")
    
    return code_masters

def enrich_layer_data(layer_dict, code_masters):
    """
    層データにコードマスタから取得した日本語名を追加
    """
    # 森林の種類1コード
    if '森林の種類1コード' in layer_dict and layer_dict['森林の種類1コード'] is not None:
        code = str(layer_dict['森林の種類1コード']).strip()
        # 0埋めなしバージョンも試す
        if code in code_masters['森林の種類']:
            layer_dict['森林の種類1名'] = code_masters['森林の種類'][code]
        else:
            try:
                code_no_zero = str(int(float(code)))
                if code_no_zero in code_masters['森林の種類']:
                    layer_dict['森林の種類1名'] = code_masters['森林の種類'][code_no_zero]
            except:
                pass
    
    # 林種コード
    if '林種コード' in layer_dict and layer_dict['林種コード'] is not None:
        code = str(layer_dict['林種コード']).strip()
        # 0埋めなしバージョンも試す
        if code in code_masters['林種']:
            layer_dict['林種名'] = code_masters['林種'][code]
        else:
            try:
                code_no_zero = str(int(float(code)))
                if code_no_zero in code_masters['林種']:
                    layer_dict['林種名'] = code_masters['林種'][code_no_zero]
            except:
                pass
    
    # 樹種1コード
    if '樹種1コード' in layer_dict and layer_dict['樹種1コード'] is not None:
        code = str(layer_dict['樹種1コード']).strip()
        if code in code_masters['樹種']:
            layer_dict['樹種1名'] = code_masters['樹種'][code]
    
    return layer_dict

def convert_forest_registry():
    """
    Shapefile + Excel を統合変換
    出力:
      - shouhan.geojson: 小班ポリゴン（KEYCODE含む）
      - layers_index.json: {keycode14: [層行配列]}
    """
    base_dir = Path("data/administrative/rinsyousigen")
    
    # 入力ファイル
    shp_path = base_dir / "01_渡島_小班.shp"
    excel_path = base_dir / "01渡島_調査簿データ.xlsx"
    code_master_path = base_dir / "森林調査簿コード.xlsx"
    
    # 出力ファイル
    output_geojson = base_dir / "shouhan.geojson"
    output_layers_json = base_dir / "layers_index.json"
    
    # ===== 0. コードマスタ読み込み =====
    code_masters = {}
    if code_master_path.exists():
        code_masters = load_code_master(code_master_path)
    else:
        print(f"警告: コードマスタが見つかりません: {code_master_path}")
    
    # ===== 1. Shapefile読み込み =====
    if not shp_path.exists():
        print(f"エラー: {shp_path} が見つかりません")
        return
    
    print(f"[1/5] Shapefile読み込み: {shp_path}")
    gdf = gpd.read_file(shp_path, encoding='shift-jis')
    print(f"  ポリゴン数: {len(gdf)}")
    print(f"  元の座標系: {gdf.crs}")
    print(f"  カラム: {list(gdf.columns)}")
    
    # KEYCODEカラムの確認
    if 'KEYCODE' not in gdf.columns:
        print("エラー: ShapefileにKEYCODEカラムがありません")
        return
    
    # WGS84に変換
    if gdf.crs and gdf.crs.to_epsg() != 4326:
        print("  座標系をWGS84 (EPSG:4326) に変換中...")
        gdf = gdf.to_crs(epsg=4326)
    
    # KEYCODEを正規化（Shapefileは文字列のはず）
    gdf['KEYCODE'] = gdf['KEYCODE'].apply(normalize_keycode)
    print(f"  KEYCODE正規化完了（例: {gdf['KEYCODE'].iloc[0]}）")
    
    # ===== 2. Excel読み込み =====
    if not excel_path.exists():
        print(f"エラー: {excel_path} が見つかりません")
        return
    
    print(f"[2/5] Excel読み込み: {excel_path}")
    # 最初のシートを読み込み（シート名が不明な場合）
    df_excel = pd.read_excel(excel_path, sheet_name=0, dtype=str)
    print(f"  行数: {len(df_excel)}")
    print(f"  カラム: {list(df_excel.columns)}")
    
    # KEYCODEカラムの確認
    if 'KEYCODE' not in df_excel.columns:
        print("エラー: ExcelにKEYCODEカラムがありません")
        return
    
    # KEYCODEを正規化
    df_excel['keycode14'] = df_excel['KEYCODE'].apply(normalize_keycode)
    print(f"  KEYCODE正規化完了（例: {df_excel['keycode14'].iloc[0]}）")
    
    # 複層区分コードをNULL→0に変換してソート用に準備
    if '複層区分コード' in df_excel.columns:
        df_excel['複層区分コード_sort'] = pd.to_numeric(df_excel['複層区分コード'], errors='coerce').fillna(0).astype(int)
    else:
        df_excel['複層区分コード_sort'] = 0
    
    # ===== 3. 層索引を作成 =====
    print("[3/5] 層索引を作成中...")
    layers_index = {}
    
    for keycode14, group in df_excel.groupby('keycode14'):
        if pd.isna(keycode14):
            continue
        
        # 複層区分コード昇順でソート
        group_sorted = group.sort_values('複層区分コード_sort')
        
        # 層行を辞書のリストに変換
        layers = []
        for _, row in group_sorted.iterrows():
            layer_dict = {}
            for col in df_excel.columns:
                if col not in ['keycode14', '複層区分コード_sort']:
                    val = row[col]
                    # NaNをNoneに変換
                    if pd.isna(val):
                        layer_dict[col] = None
                    else:
                        layer_dict[col] = val
            
            # コードマスタから日本語名を追加
            if code_masters:
                layer_dict = enrich_layer_data(layer_dict, code_masters)
            
            layers.append(layer_dict)
        
        layers_index[keycode14] = layers
    
    print(f"  層索引作成完了: {len(layers_index)} 件のKEYCODE")
    print(f"  例: {list(layers_index.keys())[0]} → {len(layers_index[list(layers_index.keys())[0]])} 層")
    
    # ===== 4. GeoJSON出力 =====
    print(f"[4/5] GeoJSON出力: {output_geojson}")
    gdf.to_file(output_geojson, driver='GeoJSON', encoding='utf-8')
    
    file_size = output_geojson.stat().st_size / (1024 * 1024)
    print(f"  ✓ GeoJSON出力完了: {file_size:.2f} MB")
    
    # ===== 5. 層索引JSON出力 =====
    print(f"[5/5] 層索引JSON出力: {output_layers_json}")
    with open(output_layers_json, 'w', encoding='utf-8') as f:
        json.dump(layers_index, f, ensure_ascii=False, indent=2)
    
    file_size = output_layers_json.stat().st_size / (1024 * 1024)
    print(f"  ✓ 層索引JSON出力完了: {file_size:.2f} MB")
    
    print("\n✅ 変換完了")
    print(f"  - 小班GeoJSON: {output_geojson}")
    print(f"  - 層索引JSON: {output_layers_json}")

if __name__ == "__main__":
    convert_forest_registry()
