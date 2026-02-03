import os
import uuid
import tempfile
from PIL import Image


class ImageService:
    def __init__(self):
        self.upload_dir = tempfile.gettempdir()
        self.files = {}
        self.file_metadata = {}
    
    def validate_geotiff(self, file_path: str) -> dict:
        """画像ファイルの検証とメタデータ抽出"""
        try:
            # GeoTIFFの場合、rasterioで座標情報を取得
            try:
                import rasterio
                from rasterio.warp import transform_bounds
                
                print(f"GeoTIFFファイルを開きます: {file_path}")
                with rasterio.open(file_path) as src:
                    bounds = src.bounds
                    crs = src.crs
                    
                    print(f"元の境界: {bounds}")
                    print(f"座標系: {crs}")
                    
                    # WGS84（緯度経度）に変換
                    if crs and str(crs) != 'EPSG:4326':
                        print(f"座標系を変換します: {crs} -> EPSG:4326")
                        bounds = transform_bounds(crs, 'EPSG:4326', *bounds)
                        print(f"変換後の境界: {bounds}")
                    
                    # 境界ボックス（西, 南, 東, 北）-> (min_lon, min_lat, max_lon, max_lat)
                    bbox = {
                        'min_lon': bounds[0],
                        'min_lat': bounds[1],
                        'max_lon': bounds[2],
                        'max_lat': bounds[3]
                    }
                    
                    print(f"最終的なbbox: {bbox}")
                    
                    warnings = []
                    if src.width < 500 or src.height < 500:
                        warnings.append('画像サイズが小さい可能性があります')
                    
                    return {
                        'valid': True,
                        'message': 'OK',
                        'info': {
                            'width': src.width,
                            'height': src.height,
                            'crs': str(crs),
                            'bbox': bbox,
                            'has_geotiff': True,
                            'warnings': warnings
                        }
                    }
            except ImportError as e:
                print(f"rasterioのインポートエラー: {e}")
                return {
                    'valid': False,
                    'message': f'rasterioがインストールされていません: {str(e)}'
                }
            except Exception as e:
                print(f"GeoTIFF読み取りエラー: {e}")
                import traceback
                traceback.print_exc()
                return {
                    'valid': False,
                    'message': f'GeoTIFF読み取りエラー: {str(e)}'
                }
        
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                'valid': False,
                'message': f'ファイル読み込みエラー: {str(e)}'
            }
    
    def register_preset_file(self, file_path: str, metadata: dict = None) -> str:
        """プリセット画像を登録してIDを返す（コピーせずに元のパスを使用）"""
        file_id = str(uuid.uuid4())
        self.files[file_id] = file_path
        
        # メタデータを保存
        if metadata:
            self.file_metadata[file_id] = metadata
        
        return file_id
    
    def save_uploaded_file(self, tmp_path: str, metadata: dict = None) -> str:
        """アップロードファイルを保存してIDを返す"""
        file_id = str(uuid.uuid4())
        new_path = os.path.join(self.upload_dir, f"{file_id}.tif")
        
        # ファイルを移動
        os.rename(tmp_path, new_path)
        self.files[file_id] = new_path
        
        # メタデータを保存
        if metadata:
            self.file_metadata[file_id] = metadata
        
        return file_id
    
    def get_file_metadata(self, file_id: str) -> dict:
        """ファイルのメタデータを取得"""
        return self.file_metadata.get(file_id, {})
    
    def get_file_path(self, file_id: str) -> str:
        """ファイルIDからパスを取得"""
        return self.files.get(file_id)
    
    def crop_to_bbox(self, image_path: str, bbox: tuple) -> str:
        """指定範囲で画像をクロップ（MVP版：元画像をそのまま使用）"""
        # MVP版では座標変換を省略し、元画像をそのまま返す
        # 実際の実装ではrasterioを使用して座標ベースのクロップを行う
        return image_path
