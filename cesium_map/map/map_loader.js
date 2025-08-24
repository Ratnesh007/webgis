function loadCesiumMap() {
  const content = document.getElementById("main-content");
  content.innerHTML = `
    <h2 style="margin:0;">Cesium Map</h2>
    <div id="cesiumContainer" style="height: 600px; width: 100%;"></div>
  `;

  // Inject Cesium dynamically if not already present
  if (typeof Cesium === "undefined") {
    const cesiumCSS = document.createElement("link");
    cesiumCSS.rel = "stylesheet";
    cesiumCSS.href = "https://cesium.com/downloads/cesiumjs/releases/1.114/Build/Cesium/Widgets/widgets.css";
    document.head.appendChild(cesiumCSS);

    const cesiumScript = document.createElement("script");
    cesiumScript.src = "https://cesium.com/downloads/cesiumjs/releases/1.114/Build/Cesium/Cesium.js";
    cesiumScript.onload = initCesiumViewer;
    document.body.appendChild(cesiumScript);
  } else {
    initCesiumViewer();
  }

  function initCesiumViewer() {
    // ✅ Put your Ion token here
    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkNmY3ODRmYi1jMGNiLTQzOGYtYmVkZi1jNWY3NGY0Yjc3ZDgiLCJpZCI6NjQwNjYsImlhdCI6MTYyODc3MjAwNn0.jbTQVkW7HYJaLaMmzeRtDEwnbtwrQ8gs_velaUUjdZg";

    Cesium.CesiumTerrainProvider.fromIonAssetId(1).then(terrain => {
      const viewer = new Cesium.Viewer("cesiumContainer", {
        terrainProvider: terrain,
        baseLayerPicker: true,
        timeline: false,
        animation: false
      });

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(77.47422871664293, 25.023188632878277, 20000000.0) //india 
      });
    });
  }
}
