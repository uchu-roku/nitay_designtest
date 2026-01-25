import React from 'react'
import Map from './Map'
import './App.css'

function AppTest() {
  const handleAnalyze = () => {
    console.log('Analyze called')
  }

  return (
    <div className="app">
      <div className="sidebar">
        <h1>Test</h1>
      </div>
      <div className="map-container">
        <Map 
          onAnalyze={handleAnalyze} 
          disabled={false}
          imageBounds={null}
          fileId={null}
          zoomToImage={0}
          treePoints={[]}
          polygonCoords={null}
          sapporoBounds={null}
          mode="map"
          onClearResults={() => {}}
          onImageLoaded={() => {}}
          isMultiPolygon={false}
          drawMode={false}
          drawType="rectangle"
          showAdminBoundaries={false}
          showRivers={false}
          showForestRegistry={false}
          showSlope={false}
          showContour={false}
          forestSearchQuery=""
          onDrawModeChange={() => {}}
          onForestSearchQueryChange={() => {}}
          onHasShapeChange={() => {}}
        />
      </div>
    </div>
  )
}

export default AppTest
