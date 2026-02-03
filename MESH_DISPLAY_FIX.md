# メッシュ表示の修正完了

## 実施した変更

### 1. 白い背景レイヤーの削除
**ファイル**: `frontend/src/Map.jsx` (行1360-1456付近)

- 白い背景ポリゴン/矩形を作成していたコードを完全に削除
- メッシュのみが表示されるようになりました

### 2. グリッドベースの位置生成
**ファイル**: `backend/services/analysis_service.py` (`_generate_tree_points`メソッド)

**変更前**:
- ランダムな位置に樹木ポイントを配置
- 最大100本まで表示
- 位置が不規則で隙間が発生

**変更後**:
- 5m x 5mの規則的なグリッドを生成
- グリッドの中心点に樹木ポイントを配置
- ポリゴン境界内のグリッドセルのみを使用
- 位置が整列し、隙間なく表示

## 結果

✅ **白い部分がない** - 白い背景レイヤーを削除
✅ **隙間を埋める** - グリッドベースで連続的に配置
✅ **整列させる** - 5m x 5mの規則的なグリッド
✅ **森林簿区域を超えない** - ポリゴン境界でクリッピング

## 技術詳細

### グリッド計算
```python
# 5m x 5mのメッシュサイズ
mesh_size_m = 5
avg_lat = (min_lat + max_lat) / 2
lat_step = mesh_size_m / 111000  # 緯度1度 ≈ 111km
lon_step = mesh_size_m / (111000 * math.cos(math.radians(avg_lat)))

# グリッドを生成
current_lat = grid_min_lat
while current_lat < max_lat:
    current_lon = grid_min_lon
    while current_lon < max_lon:
        center_lat = current_lat + lat_step / 2
        center_lon = current_lon + lon_step / 2
        
        # ポリゴン内チェック
        if polygon and not self._point_in_polygon((center_lon, center_lat), polygon):
            continue
        
        # グリッドセルを追加
        tree_points.append({...})
```

### メッシュ表示
- 各グリッドセルは5m x 5mの矩形として表示
- `weight: 0` で境界線なし
- 針葉樹（緑）と広葉樹（茶色）で色分け
- 材積に応じて不透明度を調整

## 確認方法

1. バックエンドを再起動: `cd backend && python main.py`
2. フロントエンドを再起動: `cd frontend && npm run dev`
3. 小班を選択して解析ボタンをクリック
4. メッシュ表示を確認:
   - 白い背景がないこと
   - グリッド状に整列していること
   - 隙間がないこと
   - 森林簿の境界を超えていないこと
