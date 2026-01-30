import json
import os
from pathlib import Path

def merge_forest_registry():
    """分割されたforest_registry.geojsonを結合"""
    split_dir = Path('frontend/public/data/administrative/kitamirinsyou/split')
    output_file = Path('frontend/public/data/administrative/kitamirinsyou/forest_registry_merged.geojson')
    
    if not split_dir.exists():
        print(f"分割ディレクトリが見つかりません: {split_dir}")
        return
    
    index_file = split_dir / 'index.json'
    if not index_file.exists():
        print(f"インデックスファイルが見つかりません: {index_file}")
        return
    
    print(f"インデックスを読み込み: {index_file}")
    with open(index_file, 'r', encoding='utf-8') as f:
        index = json.load(f)
    
    print(f"分割ファイル数: {index['num_parts']}")
    
    # 全フィーチャーを結合
    all_features = []
    for part_info in index['parts']:
        part_file = split_dir / part_info['file']
        print(f"読み込み中: {part_file} ({part_info['features']} features)")
        
        with open(part_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            all_features.extend(data['features'])
    
    # 結合したGeoJSONを作成
    merged = {
        'type': 'FeatureCollection',
        'features': all_features
    }
    
    print(f"\n結合完了: {len(all_features)} features")
    print(f"出力先: {output_file}")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False)
    
    file_size = os.path.getsize(output_file) / (1024 * 1024)
    print(f"ファイルサイズ: {file_size:.2f} MB")

if __name__ == '__main__':
    merge_forest_registry()
