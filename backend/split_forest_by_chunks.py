import json
import os
import math

def split_forest_registry_by_chunks():
    """Split forest_registry.geojson into chunks of ~50MB each"""
    input_file = 'frontend/public/data/administrative/kitamirinsyou/forest_registry.geojson'
    output_dir = 'frontend/public/data/administrative/kitamirinsyou/split'
    
    print(f"Loading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    total_features = len(data['features'])
    print(f"Total features: {total_features}")
    
    # Calculate chunk size (aim for ~50MB per file)
    # 127MB / 103694 features ≈ 1.2KB per feature
    # 50MB / 1.2KB ≈ 40000 features per chunk
    features_per_chunk = 40000
    num_chunks = math.ceil(total_features / features_per_chunk)
    
    print(f"Splitting into {num_chunks} chunks of ~{features_per_chunk} features each")
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Split into chunks
    chunk_info = []
    for i in range(num_chunks):
        start_idx = i * features_per_chunk
        end_idx = min((i + 1) * features_per_chunk, total_features)
        chunk_features = data['features'][start_idx:end_idx]
        
        output_file = os.path.join(output_dir, f'forest_part_{i+1}.geojson')
        geojson = {
            'type': 'FeatureCollection',
            'features': chunk_features
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(geojson, f, ensure_ascii=False)
        
        file_size = os.path.getsize(output_file) / (1024 * 1024)
        print(f"  Part {i+1}: {len(chunk_features)} features, {file_size:.2f} MB")
        
        chunk_info.append({
            'part': i + 1,
            'file': f'forest_part_{i+1}.geojson',
            'features': len(chunk_features),
            'size_mb': round(file_size, 2)
        })
    
    # Create index file
    index = {
        'total_features': total_features,
        'num_parts': num_chunks,
        'parts': chunk_info
    }
    index_file = os.path.join(output_dir, 'index.json')
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    
    print(f"\nSplit complete! Files saved to {output_dir}")
    print(f"Index file: {index_file}")

if __name__ == '__main__':
    split_forest_registry_by_chunks()
