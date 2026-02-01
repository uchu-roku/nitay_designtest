"""
Shapefileから簡易的な小班GeoJSONを生成（Excelデータなし）
"""
import geopandas as gpd
from pathlib import Path

def generate_simple_forest():
    base_dir = Path("data/administrative/rinsyousigen")
    shp_path = base_dir / "01_渡島_小班.shp"
    output_path = base_dir / "shouhan_simple.geojson"
    
    print(f"Shapefile読み込み: {shp_path}")
    gdf = gpd.read_file(shp_path, encoding='shift-jis')
    print(f"ポリゴン数: {len(gdf)}")
    
    # WGS84に変換
    if gdf.crs and gdf.crs.to_epsg() != 4326:
        print("座標系をWGS84に変換中...")
        gdf = gdf.to_crs(epsg=4326)
    
    # 全データを出力
    print(f"全データ出力: {len(gdf)} 件")
    
    print(f"GeoJSON出力: {output_path}")
    gdf.to_file(output_path, driver='GeoJSON', encoding='utf-8')
    
    file_size = output_path.stat().st_size / (1024 * 1024)
    print(f"✓ 完了: {file_size:.2f} MB")

if __name__ == "__main__":
    generate_simple_forest()
