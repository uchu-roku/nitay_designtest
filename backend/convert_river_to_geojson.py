"""
河川データ（W05）をGeoJSONに変換するスクリプト
"""
import geopandas as gpd
import os
import zipfile
import glob

# 河川データのディレクトリ
river_dir = "data/administrative/kasen"

print(f"河川データディレクトリ: {river_dir}")

# ZIPファイルを探す
zip_files = glob.glob(os.path.join(river_dir, "W05*.zip"))
print(f"河川ZIPファイル: {zip_files}")

for zip_path in zip_files:
    print(f"\nZIPファイルを解凍します: {zip_path}")
    
    # ZIPファイルを解凍
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(river_dir)
        print(f"解凍完了: {river_dir}")

# Shapefileを探す（W05で始まるもの）
shp_files = glob.glob(os.path.join(river_dir, "**/W05*.shp"), recursive=True)
print(f"\n河川Shapefileが見つかりました: {len(shp_files)}個")

for shp_file in shp_files:
    print(f"\n処理中: {shp_file}")
    try:
        # Shapefileを読み込み
        gdf = gpd.read_file(shp_file)
        
        print(f"  レコード数: {len(gdf)}")
        print(f"  カラム: {list(gdf.columns)}")
        print(f"  座標系: {gdf.crs}")
        print(f"  ジオメトリタイプ: {gdf.geometry.type.unique()}")
        
        # WGS84（緯度経度）に変換
        if gdf.crs and str(gdf.crs) != 'EPSG:4326':
            print(f"  座標系を変換: {gdf.crs} -> EPSG:4326")
            gdf = gdf.to_crs('EPSG:4326')
        
        # ファイル名を生成
        base_name = os.path.splitext(os.path.basename(shp_file))[0]
        output_file = os.path.join(river_dir, "rivers.geojson")
        
        # GeoJSONとして保存
        gdf.to_file(output_file, driver='GeoJSON')
        print(f"  保存完了: {output_file}")
        print(f"  ファイルサイズ: {os.path.getsize(output_file) / 1024 / 1024:.2f} MB")
        
        # 簡略化版も作成（ファイルサイズ削減）
        print(f"  簡略化版を作成中...")
        gdf_simplified = gdf.copy()
        gdf_simplified['geometry'] = gdf_simplified['geometry'].simplify(0.0005)  # より細かく
        output_file_simple = os.path.join(river_dir, "rivers_simple.geojson")
        gdf_simplified.to_file(output_file_simple, driver='GeoJSON')
        print(f"  簡略化版保存完了: {output_file_simple}")
        print(f"  ファイルサイズ: {os.path.getsize(output_file_simple) / 1024 / 1024:.2f} MB")
        
    except Exception as e:
        print(f"  エラー: {e}")
        import traceback
        traceback.print_exc()

print("\n変換完了！")
