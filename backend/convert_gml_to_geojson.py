"""
国土数値情報のGMLファイルをGeoJSONに変換するスクリプト
"""
import geopandas as gpd
import os
import zipfile

# ZIPファイルのパス
zip_path = "data/administrative/N03-20250101_01_GML.zip"
output_dir = "data/administrative"

print(f"ZIPファイルを解凍します: {zip_path}")

# ZIPファイルを解凍
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(output_dir)
    print(f"解凍完了: {output_dir}")

# GMLファイルを探す
gml_files = []
for root, dirs, files in os.walk(output_dir):
    for file in files:
        if file.endswith('.xml') or file.endswith('.gml'):
            gml_files.append(os.path.join(root, file))

print(f"GMLファイルが見つかりました: {len(gml_files)}個")

for gml_file in gml_files:
    # メタデータファイルはスキップ
    if 'META' in gml_file:
        continue
    
    print(f"\n処理中: {gml_file}")
    try:
        # GMLファイルを読み込み（ドライバーを明示的に指定）
        gdf = gpd.read_file(gml_file, driver='GML')
        
        # GeoDataFrameでない場合はスキップ
        if not isinstance(gdf, gpd.GeoDataFrame):
            print(f"  スキップ: GeoDataFrameではありません")
            continue
        
        # ジオメトリがない場合はスキップ
        if 'geometry' not in gdf.columns or gdf.geometry.is_empty.all():
            print(f"  スキップ: ジオメトリがありません")
            continue
        
        print(f"  レコード数: {len(gdf)}")
        print(f"  カラム: {list(gdf.columns)}")
        print(f"  座標系: {gdf.crs}")
        
        # WGS84（緯度経度）に変換
        if gdf.crs and str(gdf.crs) != 'EPSG:4326':
            print(f"  座標系を変換: {gdf.crs} -> EPSG:4326")
            gdf = gdf.to_crs('EPSG:4326')
        
        # ファイル名から判定
        if 'subprefecture' in gml_file:
            base_name = "hokkaido_admin_subprefecture"
        else:
            base_name = "hokkaido_admin"
        
        # GeoJSONとして保存
        output_file = os.path.join(output_dir, f"{base_name}.geojson")
        gdf.to_file(output_file, driver='GeoJSON')
        print(f"  保存完了: {output_file}")
        print(f"  ファイルサイズ: {os.path.getsize(output_file) / 1024 / 1024:.2f} MB")
        
        # 簡略化版も作成（ファイルサイズ削減）
        gdf_simplified = gdf.copy()
        gdf_simplified['geometry'] = gdf_simplified['geometry'].simplify(0.001)
        output_file_simple = os.path.join(output_dir, f"{base_name}_simple.geojson")
        gdf_simplified.to_file(output_file_simple, driver='GeoJSON')
        print(f"  簡略化版保存完了: {output_file_simple}")
        print(f"  ファイルサイズ: {os.path.getsize(output_file_simple) / 1024 / 1024:.2f} MB")
        
    except Exception as e:
        print(f"  エラー: {e}")
        import traceback
        traceback.print_exc()

print("\n変換完了！")
