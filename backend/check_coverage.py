import geopandas as gpd

gdf = gpd.read_file('data/administrative/rinsyousigen/01_渡島_小班.shp', encoding='shift-jis')
gdf_wgs84 = gdf.to_crs('EPSG:4326')

muni_codes = {
    '01010': '函館市',
    '01020': '北斗市',
    '01030': '松前町',
    '01040': '福島町',
    '01050': '知内町',
    '01070': '木古内町',
    '01130': '七飯町',
    '01150': '鹿部町',
    '01160': '森町',
    '01170': '八雲町',
    '01190': '長万部町'
}

print("市町村別データ範囲:")
print("-" * 80)
for code, name in muni_codes.items():
    subset = gdf_wgs84[gdf_wgs84['KEYCODE'].astype(str).str.startswith(code)]
    if len(subset) > 0:
        bounds = subset.total_bounds
        print(f'{name} ({code}): {len(subset):,}件')
        print(f'  緯度: {bounds[1]:.4f}°N ～ {bounds[3]:.4f}°N')
        print(f'  経度: {bounds[0]:.4f}°E ～ {bounds[2]:.4f}°E')
        print()
