# Municipality Code Filtering Implementation

## Status: ✅ IMPLEMENTED - Dropdown Selection (Ready for Testing)

## Overview
Municipality code filtering has been added to the forest registry search functionality using a dropdown list to handle cases where the same 林班-小班 (forest plot) exists across different municipalities.

## Implementation Details

### KEYCODE Structure
- **Total Length**: 14 digits
- **Municipality Code**: First 2 digits (e.g., "01" for 渡島)
- **Example**: `01010000010002`
  - `01` = Municipality code (渡島)
  - `010000010002` = Forest plot identifier (林班-小班 and other codes)

### Changes Made

#### 1. App.jsx
- Added `selectedMunicipalityCode` state variable
- Added `municipalityOptions` state variable to store available municipality codes
- Added `useEffect` to automatically load municipality codes when forest registry layer is shown
- Replaced text input with dropdown `<select>` element in both search UI locations:
  - First location: Lines 1030-1060 (Mode A: 地図から解析)
  - Second location: Lines 1970-2000 (Mode B: 画像から解析)
- Dropdown features:
  - Label: "市町村"
  - Default option: "すべて" (All municipalities)
  - Dynamically populated with available municipality codes from the data
  - Automatically clears when forest registry layer is hidden

#### 2. Map.jsx
- Added `window.getMunicipalityCodes()` function to extract unique municipality codes from loaded forest registry data
- Updated `window.handleForestSearch` function (lines 340-440)
- Added `municipalityCode` parameter (optional)
- Filtering logic:
  ```javascript
  // Extract first 2 digits of KEYCODE as municipality code
  const layerMunCode = keycode.substring(0, 2)
  
  // Skip if municipality code doesn't match
  if (layerMunCode !== munCode) {
    return
  }
  ```

### User Workflow

1. **Enable Forest Registry Layer**: Click the "森林簿" button to show forest plots
2. **Municipality Dropdown Appears**: Automatically populated with available codes
3. **Select Municipality** (optional): Choose from dropdown (default: "すべて")
4. **Enter Forest Plot ID**: Input 林班-小班 (e.g., "0053-0049")
5. **Search**: Click 🔍 button or press Enter
6. **Result**: Only plots matching both municipality code AND 林班-小班 will be highlighted

### Example Usage

**Without Municipality Selection (すべて):**
- Municipality: "すべて"
- Search: "0001-0002"
- Result: All plots with 林班=0001, 小班=0002 across all municipalities

**With Municipality Selection:**
- Municipality: "01"
- Search: "0001-0002"
- Result: Only plots with 林班=0001, 小班=0002 in municipality "01" (渡島)

## Advantages of Dropdown Approach

✅ **User-friendly**: No need to remember or type municipality codes
✅ **Error-free**: Only valid codes can be selected
✅ **Discoverable**: Users can see all available municipalities
✅ **Dynamic**: Automatically updates based on loaded data
✅ **Clear default**: "すべて" option makes it obvious that filtering is optional

## Testing Checklist

- [ ] Test that dropdown appears when forest registry layer is enabled
- [ ] Test that dropdown is populated with municipality codes
- [ ] Test search with municipality "01" and a known 林班-小班
- [ ] Test search with "すべて" (should work as before)
- [ ] Test multiple plot selection with municipality filter
- [ ] Verify municipality dropdown clears when forest registry layer is disabled
- [ ] Test in both Mode A (地図から解析) and Mode B (画像から解析)

## Known Municipality Codes

Based on the data file `01_渡島_小班.shp`:
- **01**: 渡島 (Oshima)

Additional municipality codes will be automatically detected from the loaded GeoJSON data.

## Next Steps

1. **Test the implementation** with real data
2. **Verify dropdown is populated** correctly when forest registry layer loads
3. **Consider adding municipality names** alongside codes (e.g., "01 - 渡島") for better UX
4. **Add municipality code display** in the selection info popup to help users verify the filter is working

## Files Modified

- `frontend/src/App.jsx` (lines 235-236, 238-256, 1030-1060, 1970-2000)
- `frontend/src/Map.jsx` (lines 65-85, 450-455)

## Notes

- Municipality code filtering is **optional** - selecting "すべて" searches all municipalities
- The dropdown is **automatically populated** from the loaded forest registry data
- The implementation assumes KEYCODE structure: `[2-digit municipality][12-digit plot ID]`
- If KEYCODE structure is different, the `substring(0, 2)` logic may need adjustment
