"""
データファイルを外部ストレージからダウンロードするスクリプト
デプロイ時に大きなファイルをGitに含めない場合に使用
"""
import os
import sys
from pathlib import Path

def check_data_files():
    """データファイルの存在を確認"""
    base_dir = Path(__file__).parent / "data" / "administrative"
    
    required_files = {
        "admin_simple.geojson": base_dir / "admin_simple.geojson",
        "rivers_simple.geojson": base_dir / "kasen" / "rivers_simple.geojson",
        "forest_registry.geojson": base_dir / "kitamirinsyou" / "forest_registry.geojson",
    }
    
    missing_files = []
    for name, path in required_files.items():
        if not path.exists():
            missing_files.append(name)
            print(f"❌ Missing: {name}")
        else:
            size_mb = path.stat().st_size / (1024 * 1024)
            print(f"✓ Found: {name} ({size_mb:.2f} MB)")
    
    if missing_files:
        print(f"\n⚠️  {len(missing_files)} file(s) missing!")
        print("\n解決方法:")
        print("1. Git LFSを使用してファイルをプル:")
        print("   git lfs pull")
        print("\n2. または、ローカルからファイルをコピー")
        print("\n3. または、外部ストレージからダウンロード（download_from_storage()を実装）")
        return False
    else:
        print(f"\n✓ All data files present!")
        return True

def download_from_storage():
    """
    外部ストレージからデータファイルをダウンロード
    
    使用例:
    1. データファイルをS3/GCS/Azure Blobにアップロード
    2. 環境変数でURLを設定
    3. このスクリプトを起動時に実行
    """
    import requests
    
    # 環境変数からURLを取得
    data_urls = {
        "admin_simple.geojson": os.getenv("DATA_URL_ADMIN"),
        "rivers_simple.geojson": os.getenv("DATA_URL_RIVERS"),
        "forest_registry.geojson": os.getenv("DATA_URL_FOREST"),
    }
    
    base_dir = Path(__file__).parent / "data" / "administrative"
    
    for filename, url in data_urls.items():
        if not url:
            print(f"⚠️  環境変数が設定されていません: DATA_URL_{filename.split('.')[0].upper()}")
            continue
        
        # ファイルパスを決定
        if "rivers" in filename:
            filepath = base_dir / "kasen" / filename
        elif "forest" in filename:
            filepath = base_dir / "kitamirinsyou" / filename
        else:
            filepath = base_dir / filename
        
        # 既に存在する場合はスキップ
        if filepath.exists():
            print(f"✓ Already exists: {filename}")
            continue
        
        print(f"Downloading {filename} from {url}...")
        try:
            response = requests.get(url, timeout=300)
            response.raise_for_status()
            
            # ディレクトリを作成
            filepath.parent.mkdir(parents=True, exist_ok=True)
            
            # ファイルを保存
            filepath.write_bytes(response.content)
            size_mb = len(response.content) / (1024 * 1024)
            print(f"✓ Downloaded: {filename} ({size_mb:.2f} MB)")
        except Exception as e:
            print(f"❌ Failed to download {filename}: {e}")
            return False
    
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("データファイルチェック")
    print("=" * 60)
    
    # まずローカルファイルをチェック
    if not check_data_files():
        # ファイルが見つからない場合、環境変数が設定されていればダウンロード
        if any(os.getenv(f"DATA_URL_{key}") for key in ["ADMIN", "RIVERS", "FOREST"]):
            print("\n環境変数が設定されているため、ダウンロードを試みます...")
            if download_from_storage():
                print("\n✓ ダウンロード完了!")
                sys.exit(0)
            else:
                print("\n❌ ダウンロード失敗")
                sys.exit(1)
        else:
            sys.exit(1)
    else:
        sys.exit(0)
