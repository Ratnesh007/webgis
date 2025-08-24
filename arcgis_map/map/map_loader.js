function loadArcGISMap() {
  const content = document.getElementById('main-content');
  content.innerHTML = `<h2 style="margin-top: 0px;margin-bottom: 0px; font-family: Verdana, sans-serif;">ArcGIS Map</h2><div id="arcgisMap" style="height: 600px;"></div>`;

  // Add ArcGIS CSS if not already loaded
  if (!document.querySelector('link[href="https://js.arcgis.com/4.29/esri/themes/light/main.css"]')) {
    const arcgisCSS = document.createElement('link');
    arcgisCSS.rel = 'stylesheet';
    arcgisCSS.href = 'https://js.arcgis.com/4.29/esri/themes/light/main.css';
    document.head.appendChild(arcgisCSS);
  }

  // Function to initialize map
  const initArcGISMap = () => {
    require(["esri/Map", "esri/views/MapView"], (Map, MapView) => {
      const map = new Map({ basemap: "streets-navigation-vector" });
      new MapView({
        container: "arcgisMap",
        map: map,
        center: [77.47422871664293, 25.023188632878277], // India
        zoom: 3
      });
    });
  };

  // If ArcGIS JS already loaded, init immediately
  if (typeof require !== "undefined" && require.on) {
    initArcGISMap();
  } else {
    // Load ArcGIS JS then init
    const arcgisJS = document.createElement('script');
    arcgisJS.src = 'https://js.arcgis.com/4.29/';
    arcgisJS.onload = initArcGISMap;
    document.body.appendChild(arcgisJS);
  }
}
