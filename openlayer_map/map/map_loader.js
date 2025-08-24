function loadOpenLayersMap() {
  const content = document.getElementById('main-content');
  content.innerHTML = `<h2 style="margin-top: 0px;margin-bottom: 0px;">OpenLayers Map</h2><div id="olMap" style="height: 600px;"></div>`;

  // Load OpenLayers CSS if not already loaded
  if (!document.querySelector('link[href="https://cdn.jsdelivr.net/npm/ol@v10.6.0/ol.css"]')) {
    const olCSS = document.createElement('link');
    olCSS.rel = 'stylesheet';
    olCSS.href = 'https://cdn.jsdelivr.net/npm/ol@v10.6.0/ol.css';
    document.head.appendChild(olCSS);
  }

  // Function to initialize map
  const initOLMap = () => {
    new ol.Map({
      target: 'olMap',
      layers: [new ol.layer.Tile({ source: new ol.source.OSM() })],
      view: new ol.View({
        center: ol.proj.fromLonLat([77.47422871664293, 25.023188632878277]), // India
        zoom: 3
      })
    });
  };

  // If OpenLayers already loaded, init immediately
  if (typeof ol !== 'undefined') {
    initOLMap();
  } else {
    // Load script and then init
    const olJS = document.createElement('script');
    olJS.src = 'https://cdn.jsdelivr.net/npm/ol@v10.6.0/dist/ol.js';
    olJS.onload = initOLMap;
    document.body.appendChild(olJS);
  }
}
