from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import tempfile
import os
from services.image_service import ImageService
from services.analysis_service import AnalysisService

app = FastAPI(title="材積予測API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

image_service = ImageService()
analysis_service = AnalysisService()


class BoundingBox(BaseModel):
    min_lat: float
    min_lon: float
    max_lat: float
    max_lon: float


class PolygonCoord(BaseModel):
    lat: float
    lon: float


class AnalysisRequest(BaseModel):
    mode: str  # 'map' or 'upload'
    bbox: BoundingBox
    file_id: Optional[str] = None
    polygon_coords: Optional[List[PolygonCoord]] = None  # ポリゴンの座標
    forest_registry_id: Optional[str] = None  # 森林簿ID（林班・小班、オプション）


class TreePoint(BaseModel):
    lat: float
    lon: float
    tree_type: str  # 'coniferous' (針葉樹) or 'broadleaf' (広葉樹)
    dbh: float  # 胸高直径 (cm)
    volume: float  # 材積 (m³)


class AnalysisResult(BaseModel):
    tree_count: int
    volume_m3: float
    confidence: Optional[str] = None
    warnings: List[str] = []
    tree_points: List[TreePoint] = []  # 樹木位置データ


@app.get("/")
async def root():
    return {"message": "材積予測API", "version": "0.1.0-MVP"}


@app.get("/administrative/boundaries")
async def get_administrative_boundaries():
    """行政区域データを取得"""
    from fastapi.responses import FileResponse
    import os
    from pathlib import Path
    
    # ベースディレクトリを取得（main.pyの場所を基準）
    base_dir = Path(__file__).parent
    
    # 簡略化版のGeoJSONを返す
    geojson_path = base_dir / "data" / "administrative" / "admin_simple.geojson"
    
    if not geojson_path.exists():
        # フォールバック: 元のファイル
        geojson_path = base_dir / "data" / "administrative" / "N03-20250101_01.geojson"
    
    if not geojson_path.exists():
        raise HTTPException(status_code=404, detail="行政区域データが見つかりません")
    
    print(f"行政区域データを配信: {geojson_path}")
    return FileResponse(
        str(geojson_path),
        media_type="application/json",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400"  # 24時間キャッシュ
        }
    )


@app.get("/rivers/boundaries")
async def get_river_boundaries():
    """河川データを取得"""
    from fastapi.responses import FileResponse
    import os
    from pathlib import Path
    
    # ベースディレクトリを取得
    base_dir = Path(__file__).parent
    
    # 河川データのパス（kasenフォルダ内）
    geojson_path = base_dir / "data" / "administrative" / "kasen" / "rivers_simple.geojson"
    
    if not geojson_path.exists():
        print(f"河川データが見つかりません: {geojson_path}")
        # フォールバック: 完全版を試す
        geojson_path = base_dir / "data" / "administrative" / "kasen" / "W05-09_01_6441-jgd_GML.geojson"
    
    if not geojson_path.exists():
        print(f"河川データが見つかりません: {geojson_path}")
        raise HTTPException(status_code=404, detail="河川データが見つかりません")
    
    print(f"河川データを配信: {geojson_path}")
    return FileResponse(
        str(geojson_path),
        media_type="application/json",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400"  # 24時間キャッシュ
        }
    )


@app.get("/forest-registry/boundaries")
async def get_forest_registry():
    """小班ポリゴンデータを取得"""
    from fastapi.responses import FileResponse
    from pathlib import Path
    
    base_dir = Path(__file__).parent  # backendディレクトリ
    
    # 簡易版GeoJSONを返す
    geojson_path = base_dir / "data" / "administrative" / "rinsyousigen" / "shouhan_simple.geojson"
    
    if geojson_path.exists():
        print(f"小班GeoJSONを配信: {geojson_path}")
        return FileResponse(
            str(geojson_path),
            media_type="application/json",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400"
            }
        )
    
    raise HTTPException(status_code=404, detail="小班GeoJSONが見つかりません。")


@app.get("/api/layers/{keycode14}")
async def get_layers(keycode14: str):
    """
    指定KEYCODEの層データ（複層区分）を取得
    1対多の層行を全件返す
    """
    from pathlib import Path
    import json
    from fastapi.responses import JSONResponse
    
    base_dir = Path(__file__).parent
    
    # 分割ファイルから読み込み
    split_dir = base_dir / "data" / "administrative" / "rinsyousigen" / "split"
    if split_dir.exists():
        # KEYCODEの最初の5桁（市町村コード）を取得
        muni_code = keycode14[:5] if len(keycode14) >= 5 else keycode14
        part_file = split_dir / f"layers_{muni_code}.json"
        
        if part_file.exists():
            print(f"分割ファイルから層データを読み込み: {part_file}")
            try:
                with open(part_file, 'r', encoding='utf-8') as f:
                    layers_index = json.load(f)
                
                # KEYCODEで検索
                if keycode14 in layers_index:
                    layers = layers_index[keycode14]
                    print(f"層データ取得: KEYCODE={keycode14}, 層数={len(layers)}")
                    
                    return JSONResponse(
                        content={
                            "keycode": keycode14,
                            "layer_count": len(layers),
                            "layers": layers
                        },
                        headers={"Access-Control-Allow-Origin": "*"}
                    )
            except Exception as e:
                print(f"分割ファイル読み込みエラー: {e}")
    
    # フォールバック: 元のファイルを使用
    layers_json_path = base_dir / "data" / "administrative" / "rinsyousigen" / "layers_index.json"
    
    if layers_json_path.exists():
        print(f"元のファイルから層データを読み込み: {layers_json_path}")
        try:
            with open(layers_json_path, 'r', encoding='utf-8') as f:
                layers_index = json.load(f)
            
            # KEYCODEで検索
            if keycode14 in layers_index:
                layers = layers_index[keycode14]
                print(f"層データ取得: KEYCODE={keycode14}, 層数={len(layers)}")
                
                return JSONResponse(
                    content={
                        "keycode": keycode14,
                        "layer_count": len(layers),
                        "layers": layers
                    },
                    headers={"Access-Control-Allow-Origin": "*"}
                )
        except Exception as e:
            print(f"元のファイル読み込みエラー: {e}")
    
    raise HTTPException(
        status_code=404, 
        detail=f"KEYCODE {keycode14} に対応する層データが見つかりません",
        headers={"Access-Control-Allow-Origin": "*"}
    )


@app.get("/api/municipality-codes")
async def get_municipality_codes():
    """
    市町村コードのマスターデータを取得
    """
    from pathlib import Path
    import json
    from fastapi.responses import JSONResponse
    
    # デフォルトのマッピング（2桁の市町村コード）
    default_codes = {
        "01": "松前町",
        "02": "福島町",
        "03": "知内町",
        "04": "木古内町",
        "05": "北斗市",
        "07": "七飯町",
        "13": "鹿部町",
        "15": "森町",
        "16": "八雲町",
        "17": "長万部町",
        "19": "函館市"
    }
    
    base_dir = Path(__file__).parent
    municipality_codes_path = base_dir / "data" / "administrative" / "rinsyousigen" / "municipality_codes.json"
    
    if municipality_codes_path.exists():
        try:
            # マスターデータを読み込み
            with open(municipality_codes_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content and not content.startswith('version https://git-lfs'):
                    municipality_codes = json.loads(content)
                    return JSONResponse(
                        content=municipality_codes,
                        headers={"Access-Control-Allow-Origin": "*"}
                    )
        except Exception as e:
            print(f"市町村コードマスター読み込みエラー: {e}")
    
    # ファイルがない場合やエラーの場合はデフォルト値を返す
    return JSONResponse(
        content=default_codes,
        headers={"Access-Control-Allow-Origin": "*"}
    )


@app.get("/image/{file_id}")
async def get_image(file_id: str):
    """アップロードされた画像を取得（ブラウザ表示用にPNGに変換）"""
    from fastapi.responses import Response
    from PIL import Image
    import io
    
    print(f"画像リクエスト: file_id={file_id}")
    image_path = image_service.get_file_path(file_id)
    print(f"画像パス: {image_path}")
    
    if not image_path or not os.path.exists(image_path):
        print(f"画像が見つかりません: {image_path}")
        raise HTTPException(status_code=404, detail="画像が見つかりません")
    
    try:
        # GeoTIFFをPNGに変換
        print("画像を読み込んでPNGに変換します")
        
        # rasterioで読み込み
        try:
            import rasterio
            import numpy as np
            
            with rasterio.open(image_path) as src:
                # 最初の3バンドを読み込み（RGB）
                bands = min(3, src.count)
                data = src.read([i+1 for i in range(bands)])
                
                # (C, H, W) -> (H, W, C)
                if bands == 3:
                    rgb = np.transpose(data, (1, 2, 0))
                elif bands == 1:
                    # グレースケールの場合は3チャンネルに複製
                    rgb = np.stack([data[0]] * 3, axis=-1)
                else:
                    rgb = np.transpose(data[:3], (1, 2, 0))
                
                # 正規化（0-255）
                rgb_min = rgb.min()
                rgb_max = rgb.max()
                if rgb_max > rgb_min:
                    rgb = ((rgb - rgb_min) / (rgb_max - rgb_min) * 255).astype(np.uint8)
                else:
                    rgb = np.zeros_like(rgb, dtype=np.uint8)
                
                # PIL Imageに変換
                img = Image.fromarray(rgb)
        except:
            # rasterioが使えない場合はPILで直接読み込み
            print("PILで画像を読み込みます")
            img = Image.open(image_path)
            if img.mode != 'RGB':
                img = img.convert('RGB')
        
        # PNGとしてメモリに保存
        img_io = io.BytesIO()
        img.save(img_io, 'PNG', optimize=True)
        img_io.seek(0)
        
        print("PNG変換完了")
        return Response(
            content=img_io.getvalue(),
            media_type="image/png",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=3600"
            }
        )
    except Exception as e:
        print(f"画像変換エラー: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"画像変換エラー: {str(e)}")


@app.get("/preset-images")
async def get_preset_images():
    """プリセット画像のリストを取得（MVP用）"""
    from pathlib import Path
    
    base_dir = Path(__file__).parent
    gazou_dir = base_dir / "data" / "administrative" / "gazou"
    
    if not gazou_dir.exists():
        return {"images": []}
    
    images = []
    for file_path in gazou_dir.glob("*.tif"):
        images.append({
            "id": file_path.stem,
            "filename": file_path.name,
            "path": str(file_path.relative_to(base_dir))
        })
    
    return {"images": images}


@app.post("/upload-preset/{image_id}")
async def upload_preset_image(image_id: str):
    """プリセット画像を読み込む（MVP用）"""
    from pathlib import Path
    
    base_dir = Path(__file__).parent
    gazou_dir = base_dir / "data" / "administrative" / "gazou"
    
    # 画像ファイルを検索
    image_path = None
    for file_path in gazou_dir.glob(f"{image_id}.*"):
        if file_path.suffix.lower() in ['.tif', '.tiff']:
            image_path = file_path
            break
    
    if not image_path or not image_path.exists():
        raise HTTPException(status_code=404, detail="プリセット画像が見つかりません")
    
    try:
        # 画像の検証
        validation = image_service.validate_geotiff(str(image_path))
        
        if not validation['valid']:
            raise HTTPException(status_code=400, detail=validation['message'])
        
        # ファイルIDを生成して登録（コピーせずに元のパスを使用）
        file_id = image_service.register_preset_file(str(image_path), validation['info'])
        
        return {
            "file_id": file_id,
            "filename": image_path.name,
            "info": validation['info']
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"プリセット画像読み込みエラー: {str(e)}")


@app.post("/upload")
async def upload_geotiff(file: UploadFile = File(...)):
    """GeoTIFFファイルをアップロード"""
    if not file.filename.lower().endswith(('.tif', '.tiff', '.geotiff', '.jpg', '.jpeg', '.png')):
        raise HTTPException(status_code=400, detail="画像ファイル（.tif, .jpg, .png）のみ対応しています")
    
    try:
        # 一時ファイルに保存
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # 画像の検証
        validation = image_service.validate_geotiff(tmp_path)
        
        if not validation['valid']:
            os.unlink(tmp_path)
            raise HTTPException(status_code=400, detail=validation['message'])
        
        # ファイルIDを生成して保存（メタデータも保存）
        file_id = image_service.save_uploaded_file(tmp_path, validation['info'])
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "info": validation['info']
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"アップロードエラー: {str(e)}")


@app.post("/analyze", response_model=AnalysisResult)
async def analyze_area(request: AnalysisRequest):
    """指定範囲の樹木解析を実行"""
    try:
        # 範囲情報
        bbox = (request.bbox.min_lon, request.bbox.min_lat, 
                request.bbox.max_lon, request.bbox.max_lat)
        
        # ポリゴン座標（フロントエンドから送信される場合）
        polygon_coords = request.polygon_coords if hasattr(request, 'polygon_coords') else None
        
        # モードA（地図）の場合
        if request.mode == 'map':
            # 範囲サイズから推定
            area_km2 = analysis_service.calculate_area(bbox)
            # 森林簿IDがある場合は森林簿ベース解析
            if request.forest_registry_id:
                result = analysis_service.analyze_from_forest_registry(
                    area_km2, bbox, polygon_coords, request.forest_registry_id
                )
            else:
                result = analysis_service.analyze_from_map(area_km2, bbox, polygon_coords)
            return result
        
        # モードB（画像アップロード）の場合
        elif request.mode == 'upload':
            if not request.file_id:
                raise HTTPException(status_code=400, detail="ファイルIDが必要です")
            
            image_path = image_service.get_file_path(request.file_id)
            if not image_path or not os.path.exists(image_path):
                raise HTTPException(status_code=404, detail="画像ファイルが見つかりません")
            
            cropped_path = image_service.crop_to_bbox(image_path, bbox)
            detections = analysis_service.detect_trees(cropped_path)
            result = analysis_service.calculate_volume(detections, bbox, polygon_coords)
            
            if os.path.exists(cropped_path) and cropped_path != image_path:
                os.unlink(cropped_path)
            
            return result
        
        else:
            raise HTTPException(status_code=400, detail="無効なモードです")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"解析エラー: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

