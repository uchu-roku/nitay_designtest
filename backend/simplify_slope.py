"""
傾斜データを簡略化するスクリプト
"""
import json

def simplify_slope_geojson(input_file, output_file, simplify_factor=10):
    """傾斜データを簡略化"""
    
    print(f"傾斜データを簡略化します: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"元のフィーチャー数: {len(data['features'])}")
    
    # 一定間隔でフィーチャーを間引く
    simplified_features = data['features'][::simplify_factor]
    
    simplified_data = {
        "type": "FeatureCollection",
        "features": simplified_features
    }
    
    print(f"簡略化後のフィーチャー数: {len(simplified_features)}")
    
    # 保存
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(simplified_data, f, ensure_ascii=False)
    
    import os
    file_size = os.path.getsize(output_file) / (1024 * 1024)
    print(f"ファイルサイズ: {file_size:.2f} MB")
    
    return output_file

if __name__ == "__main__":
    input_file = "data/administrative/keisya/slope.geojson"
    output_file = "data/administrative/keisya/slope_simple.geojson"
    
    simplify_slope_geojson(input_file, output_file, simplify_factor=5)
    print("✅ 簡略化完了")
