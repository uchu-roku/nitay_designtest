import json
import os
from pathlib import Path

def split_forest_registry():
    """Split forest_registry.geojson by municipality code"""
    input_file = 'frontend/public/data/administrative/kitamirinsyou/forest_registry.geojson'
    output_dir = 'frontend/public/data/administrative/kitamirinsyou/split'
    
    print(f"Loading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Total features: {len(data['features'])}")
    
    # Group by municipality code
    by_municipality = {}
    for feature in data['features']:
        muni_code = feature['properties'].get('市町村コード', 'unknown')
        if muni_code not in by_municipality:
            by_municipality[muni_code] = []
        by_municipality[muni_code].append(feature)
    
    print(f"Found {len(by_municipality)} municipalities")
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Save each municipality separately
    for muni_code, features in by_municipality.items():
        output_file = os.path.join(output_dir, f'forest_{muni_code}.geojson')
        geojson = {
            'type': 'FeatureCollection',
            'features': features
        }
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(geojson, f, ensure_ascii=False)
        
        file_size = os.path.getsize(output_file) / (1024 * 1024)
        print(f"  {muni_code}: {len(features)} features, {file_size:.2f} MB")
    
    # Create index file
    index = {
        'municipalities': list(by_municipality.keys()),
        'file_pattern': 'forest_{municipality_code}.geojson'
    }
    index_file = os.path.join(output_dir, 'index.json')
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    
    print(f"\nSplit complete! Files saved to {output_dir}")

def split_layers_index():
    """Split layers_index.json by municipality code"""
    input_file = 'backend/data/administrative/rinsyousigen/layers_index.json'
    output_dir = 'backend/data/administrative/rinsyousigen/split'
    
    print(f"\nLoading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Total entries: {len(data)}")
    
    # Group by municipality code (first 5 digits of KEY_CODE)
    by_municipality = {}
    for key, value in data.items():
        muni_code = key[:5] if len(key) >= 5 else 'unknown'
        if muni_code not in by_municipality:
            by_municipality[muni_code] = {}
        by_municipality[muni_code][key] = value
    
    print(f"Found {len(by_municipality)} municipalities")
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Save each municipality separately
    for muni_code, entries in by_municipality.items():
        output_file = os.path.join(output_dir, f'layers_{muni_code}.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(entries, f, ensure_ascii=False)
        
        file_size = os.path.getsize(output_file) / (1024 * 1024)
        print(f"  {muni_code}: {len(entries)} entries, {file_size:.2f} MB")
    
    # Create index file
    index = {
        'municipalities': list(by_municipality.keys()),
        'file_pattern': 'layers_{municipality_code}.json'
    }
    index_file = os.path.join(output_dir, 'index.json')
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    
    print(f"\nSplit complete! Files saved to {output_dir}")

if __name__ == '__main__':
    split_forest_registry()
    split_layers_index()
