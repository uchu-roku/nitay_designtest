"""
森林簿データ（GPKG）をGeoJSONに変換するスクリプト
初回読み込みを高速化するため
"""
import geopandas as gpd
import json
import os

def convert_forest_registry():
    """森林簿データをGeoJSONに変換"""
    input_path = "data/administrative/kitamirinsyou/kitamirinsyou.gpkg"
    output_path = "data/administrative/kitamirinsyou/forest_registry.geojson"
    
    if not os.path.exists(input_path):
        print(f"エラー: {input_path} が見つかりません")
        return
    
    print(f"森林簿データを読み込み: {input_path}")
    gdf = gpd.read_file(input_path)
    
    print(f"データ件数: {len(gdf)}")
    print(f"元の座標系: {gdf.crs}")
    
    # WGS84に変換
    if gdf.crs and gdf.crs.to_epsg() != 4326:
        print("座標系をWGS84 (EPSG:4326) に変換中...")
        gdf = gdf.to_crs(epsg=4326)
    
    # 必要な属性のみ抽出（個人情報を除外）
    columns_to_keep = ['林班', '小班', 'GISAREA', 'geometry']
    available_columns = [col for col in columns_to_keep if col in gdf.columns]
    gdf_filtered = gdf[available_columns]
    
    print(f"保持する属性: {available_columns}")
    
    # GeoJSONに保存
    print(f"GeoJSONに変換中: {output_path}")
    gdf_filtered.to_file(output_path, driver='GeoJSON')
    
    # ファイルサイズを確認
    file_size = os.path.getsize(output_path) / (1024 * 1024)
    print(f"✓ 変換完了: {output_path} ({file_size:.2f} MB)")

if __name__ == "__main__":
    convert_forest_registry()
