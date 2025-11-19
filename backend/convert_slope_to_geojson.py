"""
傾斜データ（Shapefile）をGeoJSONに変換するスクリプト
"""
import os
import zipfile
import json
import struct
from pathlib import Path

def read_dbf(dbf_path):
    """DBFファイルを読み込む"""
    with open(dbf_path, 'rb') as f:
        # ヘッダー読み込み
        header = f.read(32)
        num_records = struct.unpack('<I', header[4:8])[0]
        header_length = struct.unpack('<H', header[8:10])[0]
        record_length = struct.unpack('<H', header[10:12])[0]
        
        # フィールド定義読み込み
        fields = []
        f.seek(32)  # ヘッダーの開始位置
        while f.tell() < header_length - 1:
            field_def = f.read(32)
            if len(field_def) < 32 or field_def[0] == 0x0D:  # 終端マーカー
                break
            
            # フィールド名（11バイト、NULL終端）
            field_name = field_def[0:11].decode('ascii', errors='ignore').rstrip('\x00').strip()
            # フィールドタイプ
            field_type = chr(field_def[11])
            # フィールド長
            field_length = field_def[16]
            # 小数点以下桁数
            field_decimal = field_def[17]
            
            fields.append((field_name, field_type, field_length, field_decimal))
        
        # レコード開始位置に移動
        f.seek(header_length)
        
        # レコード読み込み
        records = []
        for _ in range(num_records):
            record_data = f.read(record_length)
            if len(record_data) < record_length:
                break
            
            if record_data[0] == 0x2A:  # 削除マーク
                continue
            
            record = {}
            offset = 1
            for field_name, field_type, field_length, field_decimal in fields:
                value_bytes = record_data[offset:offset+field_length]
                
                try:
                    value_str = value_bytes.decode('shift_jis', errors='ignore').strip()
                    
                    if field_type == 'N' or field_type == 'F':  # 数値
                        if value_str:
                            try:
                                if field_decimal > 0 or '.' in value_str:
                                    value = float(value_str)
                                else:
                                    value = int(value_str)
                            except:
                                value = value_str
                        else:
                            value = None
                    else:
                        value = value_str
                except:
                    value = None
                
                record[field_name] = value
                offset += field_length
            
            records.append(record)
        
        return records

def read_shp(shp_path):
    """Shapefileを読み込む（簡易版）"""
    with open(shp_path, 'rb') as f:
        # ヘッダー読み込み
        f.read(100)
        
        geometries = []
        while True:
            # レコードヘッダー
            record_header = f.read(8)
            if len(record_header) < 8:
                break
            
            record_length = struct.unpack('>I', record_header[4:8])[0] * 2
            
            # シェイプタイプ
            shape_type = struct.unpack('<I', f.read(4))[0]
            
            if shape_type == 5:  # Polygon
                # バウンディングボックス
                f.read(32)
                
                # パート数とポイント数
                num_parts = struct.unpack('<I', f.read(4))[0]
                num_points = struct.unpack('<I', f.read(4))[0]
                
                # パートインデックス
                parts = [struct.unpack('<I', f.read(4))[0] for _ in range(num_parts)]
                parts.append(num_points)
                
                # ポイント読み込み
                coordinates = []
                for i in range(num_parts):
                    part_coords = []
                    for j in range(parts[i], parts[i+1]):
                        x, y = struct.unpack('<dd', f.read(16))
                        part_coords.append([x, y])
                    coordinates.append(part_coords)
                
                if len(coordinates) == 1:
                    geometries.append({
                        "type": "Polygon",
                        "coordinates": coordinates
                    })
                else:
                    geometries.append({
                        "type": "MultiPolygon",
                        "coordinates": [coordinates]
                    })
            else:
                # 他のシェイプタイプはスキップ
                f.read(record_length - 4)
        
        return geometries

def convert_slope_to_geojson(input_dir, output_file):
    """傾斜データのShapefileをGeoJSONに変換"""
    
    print(f"傾斜データを変換します: {input_dir}")
    
    # 出力用のGeoJSON構造
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    
    # ZIPファイルを処理
    zip_files = list(Path(input_dir).glob("*.zip"))
    print(f"ZIPファイル数: {len(zip_files)}")
    
    for i, zip_path in enumerate(zip_files, 1):
        print(f"[{i}/{len(zip_files)}] 処理中: {zip_path.name}")
        
        try:
            # ZIPを解凍
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # 一時ディレクトリに解凍
                temp_dir = Path(input_dir) / "temp"
                temp_dir.mkdir(exist_ok=True)
                zip_ref.extractall(temp_dir)
                
                # Shapefileを探す
                shp_files = list(temp_dir.glob("**/*.shp"))
                
                for shp_file in shp_files:
                    dbf_file = shp_file.with_suffix('.dbf')
                    
                    if not dbf_file.exists():
                        print(f"  ⚠️ DBFファイルが見つかりません: {shp_file.name}")
                        continue
                    
                    print(f"  処理中: {shp_file.name}")
                    
                    # ShapefileとDBFを読み込み
                    geometries = read_shp(shp_file)
                    records = read_dbf(dbf_file)
                    
                    # GeoJSONフィーチャーを作成
                    for geom, record in zip(geometries, records):
                        geojson["features"].append({
                            "type": "Feature",
                            "geometry": geom,
                            "properties": record
                        })
                
                # 一時ファイルを削除
                import shutil
                shutil.rmtree(temp_dir)
        
        except Exception as e:
            print(f"  ❌ エラー: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    # GeoJSONを保存
    print(f"\nGeoJSONを保存: {output_file}")
    print(f"フィーチャー数: {len(geojson['features'])}")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, ensure_ascii=False)
    
    # ファイルサイズを表示
    file_size = os.path.getsize(output_file) / (1024 * 1024)
    print(f"ファイルサイズ: {file_size:.2f} MB")
    
    return output_file

if __name__ == "__main__":
    input_dir = "data/administrative/keisya"
    output_file = "data/administrative/keisya/slope.geojson"
    
    convert_slope_to_geojson(input_dir, output_file)
    print("✅ 変換完了")
