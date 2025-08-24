function loadArcGISBaseMapGallery() {
  const content = document.getElementById('main-content');
  content.innerHTML = `<h2 style="margin-top: 0px;margin-bottom: 0px;">ArcGIS BaseMap Gallery</h2><div id="arcgisMap" style="height: 600px;"></div>`;

  // Add ArcGIS CSS if not already loaded
  if (!document.querySelector('link[href="https://js.arcgis.com/4.29/esri/themes/light/main.css"]')) {
    const arcgisCSS = document.createElement('link');
    arcgisCSS.rel = 'stylesheet';
    arcgisCSS.href = 'https://js.arcgis.com/4.29/esri/themes/light/main.css';
    document.head.appendChild(arcgisCSS);
  }

  // Function to initialize map
  const initArcGISMap = () => {
    require([
      "esri/Map",
      "esri/views/MapView",
      "esri/widgets/BasemapGallery",
      "esri/widgets/Expand"
    ], (Map, MapView, BasemapGallery, Expand) => {
      const map = new Map({ basemap: "streets-navigation-vector" });

      const view = new MapView({
        container: "arcgisMap",
        map: map,
        center: [78.9629, 20.5937], 
        zoom: 3
      });

      view.when(() => {
        // Create BasemapGallery widget
        const basemapGallery = new BasemapGallery({
          view: view
        });

        // Wrap it in Expand for collapsible behavior
        const expand = new Expand({
          view: view,
          content: basemapGallery,
          expanded: false
        });

        // Add to top-right corner of the view
        view.ui.add(expand, "top-right");
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
