from PIL import Image
import random
import math


class AnalysisService:
    def __init__(self):
        # MVP版：簡易的な検出シミュレーション
        pass
    
    def calculate_area(self, bbox: tuple) -> float:
        """緯度経度から面積を計算（km²）"""
        min_lon, min_lat, max_lon, max_lat = bbox
        
        # 簡易的な面積計算（メルカトル図法の近似）
        lat_diff = max_lat - min_lat
        lon_diff = max_lon - min_lon
        
        # 緯度1度 ≈ 111km、経度1度 ≈ 111km * cos(緯度)
        avg_lat = (min_lat + max_lat) / 2
        lat_km = lat_diff * 111
        lon_km = lon_diff * 111 * math.cos(math.radians(avg_lat))
        
        area_km2 = lat_km * lon_km
        return area_km2
    
    def _point_in_polygon(self, point: tuple, polygon: list) -> bool:
        """点がポリゴン内にあるかチェック（Ray casting algorithm）"""
        x, y = point
        n = len(polygon)
        inside = False
        
        p1x, p1y = polygon[0]
        for i in range(1, n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        
        return inside
    
    def _generate_tree_points(self, tree_count: int, bbox: tuple, polygon_coords: list = None) -> list:
        """樹木位置を生成する共通メソッド（グリッドベース）"""
        tree_points = []
        
        if bbox:
            min_lon, min_lat, max_lon, max_lat = bbox
            
            # ポリゴン座標を変換
            polygon = None
            if polygon_coords:
                # Pydanticモデルの場合は属性アクセス、辞書の場合は[]アクセス
                if hasattr(polygon_coords[0], 'lon'):
                    polygon = [(coord.lon, coord.lat) for coord in polygon_coords]
                else:
                    polygon = [(coord['lon'], coord['lat']) for coord in polygon_coords]
            
            # グリッドサイズを計算（5m x 5m）
            mesh_size_m = 5
            avg_lat = (min_lat + max_lat) / 2
            lat_step = mesh_size_m / 111000  # 緯度1度 ≈ 111km
            lon_step = mesh_size_m / (111000 * math.cos(math.radians(avg_lat)))
            
            # グリッドの開始位置を計算（境界に合わせる）
            grid_min_lat = min_lat
            grid_min_lon = min_lon
            
            # グリッドを生成
            current_lat = grid_min_lat
            while current_lat < max_lat:
                current_lon = grid_min_lon
                while current_lon < max_lon:
                    # グリッドの中心点
                    center_lat = current_lat + lat_step / 2
                    center_lon = current_lon + lon_step / 2
                    
                    # ポリゴンが指定されている場合は範囲内チェック
                    if polygon and not self._point_in_polygon((center_lon, center_lat), polygon):
                        current_lon += lon_step
                        continue
                    
                    # ランダムに針葉樹/広葉樹を割り当て
                    tree_type = 'coniferous' if random.random() < 0.6 else 'broadleaf'
                    
                    # ランダムなDBHと材積
                    dbh = random.uniform(15, 45)
                    volume = random.uniform(0.2, 1.2)
                    
                    tree_points.append({
                        'lat': center_lat,
                        'lon': center_lon,
                        'tree_type': tree_type,
                        'dbh': round(dbh, 1),
                        'volume': round(volume, 3)
                    })
                    
                    current_lon += lon_step
                current_lat += lat_step
        
        return tree_points
    
    def analyze_from_map(self, area_km2: float, bbox: tuple = None, polygon_coords: list = None) -> dict:
        """地図モード：面積から樹木本数と材積を推定（ランダム）"""
        # 面積に応じた基準値（1km²あたり）
        trees_per_km2 = random.randint(800, 1500)
        volume_per_tree = random.uniform(0.3, 0.8)
        
        # 実際の面積での推定
        tree_count = int(area_km2 * trees_per_km2)
        total_volume = tree_count * volume_per_tree
        
        # 樹木位置の生成
        tree_points = self._generate_tree_points(tree_count, bbox, polygon_coords)
        
        warnings = []
        confidence = 'medium'
        
        if area_km2 < 0.01:
            warnings.append('範囲が小さいため、精度が低い可能性があります')
            confidence = 'low'
        elif area_km2 > 10:
            warnings.append('範囲が大きいため、誤差が増える可能性があります')
            confidence = 'low'
        
        warnings.append(f'解析面積: {area_km2:.4f} km²')
        if tree_count > 100:
            warnings.append(f'※ 検出本数: {tree_count}本（地図上には100本まで表示）')
        warnings.append('※MVP版：ランダムシミュレーションによる推定値です')
        
        return {
            'tree_count': tree_count,
            'volume_m3': round(total_volume, 2),
            'confidence': confidence,
            'warnings': warnings,
            'tree_points': tree_points
        }
    
    def analyze_from_forest_registry(self, area_km2: float, bbox: tuple = None, 
                                     polygon_coords: list = None, registry_id: str = None) -> dict:
        """森林簿ベースモード：林班・小班から樹木本数と材積を推定"""
        # 面積に応じた基準値（1km²あたり）
        trees_per_km2 = random.randint(800, 1500)
        volume_per_tree = random.uniform(0.3, 0.8)
        
        # 実際の面積での推定
        tree_count = int(area_km2 * trees_per_km2)
        total_volume = tree_count * volume_per_tree
        
        # 樹木位置の生成
        tree_points = self._generate_tree_points(tree_count, bbox, polygon_coords)
        
        warnings = []
        confidence = 'medium'
        
        if area_km2 < 0.01:
            warnings.append('範囲が小さいため、精度が低い可能性があります')
            confidence = 'low'
        elif area_km2 > 10:
            warnings.append('範囲が大きいため、誤差が増える可能性があります')
            confidence = 'low'
        
        warnings.append(f'解析面積: {area_km2:.4f} km²')
        if registry_id:
            warnings.append(f'森林簿ID: {registry_id}')
        warnings.append('※ 森林簿データとの比較機能は今後実装予定')
        if tree_count > 100:
            warnings.append(f'※ 検出本数: {tree_count}本（地図上には100本まで表示）')
        warnings.append('※MVP版：ランダムシミュレーションによる推定値です')
        
        return {
            'tree_count': tree_count,
            'volume_m3': round(total_volume, 2),
            'confidence': confidence,
            'warnings': warnings,
            'tree_points': tree_points
        }
    
    def detect_trees(self, image_path: str) -> dict:
        """樹木検出を実行（MVP版：簡易シミュレーション）"""
        try:
            # 画像サイズを取得
            img = Image.open(image_path)
            width, height = img.size
            
            # 画像サイズに応じて検出本数をシミュレート
            # 実際のDeepForest実装時に置き換え
            area_pixels = width * height
            estimated_trees = int(area_pixels / 50000)  # 仮の密度
            
            # ランダムに検出位置を生成
            detections = []
            for _ in range(estimated_trees):
                x = random.randint(0, width)
                y = random.randint(0, height)
                size = random.randint(20, 80)
                detections.append({
                    'xmin': x,
                    'ymin': y,
                    'xmax': x + size,
                    'ymax': y + size
                })
            
            return {'detections': detections, 'count': len(detections)}
        
        except Exception as e:
            print(f"検出エラー: {str(e)}")
            return {'detections': [], 'count': 0}
    
    def calculate_volume(self, detection_result: dict, bbox: tuple = None, polygon_coords: list = None) -> dict:
        """材積を計算"""
        detections = detection_result.get('detections', [])
        tree_count = detection_result.get('count', 0)
        
        if tree_count == 0:
            return {
                'tree_count': 0,
                'volume_m3': 0.0,
                'confidence': 'low',
                'warnings': ['樹木が検出されませんでした'],
                'tree_points': []
            }
        
        # 簡易的な材積計算と樹木位置の生成
        total_volume = 0.0
        tree_points = []
        
        # 範囲の緯度経度（bboxがある場合）
        if bbox:
            min_lon, min_lat, max_lon, max_lat = bbox
        else:
            min_lon, min_lat, max_lon, max_lat = 140.0, 40.0, 141.0, 41.0
        
        # ポリゴン座標を変換
        polygon = None
        if polygon_coords:
            # Pydanticモデルの場合は属性アクセス、辞書の場合は[]アクセス
            if hasattr(polygon_coords[0], 'lon'):
                polygon = [(coord.lon, coord.lat) for coord in polygon_coords]
            else:
                polygon = [(coord['lon'], coord['lat']) for coord in polygon_coords]
        
        for i, det in enumerate(detections):
            crown_width = det['xmax'] - det['xmin']
            crown_height = det['ymax'] - det['ymin']
            crown_diameter = (crown_width + crown_height) / 2
            
            # 冠径→DBH→材積の簡易式
            dbh_cm = crown_diameter * 0.3 * 30
            height_m = dbh_cm * 0.8
            volume = 0.00005 * (dbh_cm ** 2) * height_m
            total_volume += volume
            
            # ランダムな位置を生成（範囲内）
            attempts = 0
            while attempts < 100:
                lat = random.uniform(min_lat, max_lat)
                lon = random.uniform(min_lon, max_lon)
                
                # ポリゴンが指定されている場合は範囲内チェック
                if polygon and not self._point_in_polygon((lon, lat), polygon):
                    attempts += 1
                    continue
                
                break
            
            # ランダムに針葉樹/広葉樹を割り当て（針葉樹60%, 広葉樹40%）
            tree_type = 'coniferous' if random.random() < 0.6 else 'broadleaf'
            
            tree_points.append({
                'lat': lat,
                'lon': lon,
                'tree_type': tree_type,
                'dbh': round(dbh_cm, 1),
                'volume': round(volume, 3)
            })
        
        warnings = []
        confidence = 'medium'
        
        if tree_count < 5:
            warnings.append('検出本数が少ないため、精度が低い可能性があります')
            confidence = 'low'
        
        warnings.append('※MVP版：画像ベースのランダムシミュレーションです')
        
        return {
            'tree_count': int(tree_count),
            'volume_m3': float(round(total_volume, 2)),
            'confidence': confidence,
            'warnings': warnings,
            'tree_points': tree_points
        }
