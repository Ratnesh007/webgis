function loadHereMap() {
  const content = document.getElementById('main-content');
  content.innerHTML = `<h2 style="margin-top: 0px;margin-bottom: 0px;">HERE Map</h2><div id="hereMap" style="height: 600px;"></div>`;

  // Replace with your own HERE API key
  const apiKey = "mBN-cdOLveHULlFk0QXVX3aIfPyqQuKl41V6hUbqKMA";
  ////https://github.com/heremaps/maps-api-for-javascript-examples/commit/6a72b12fb915e3f6405257fd1ec5a94429176fb3

  // Load HERE Maps JS if not already loaded
  if (typeof H !== 'undefined') {
    initHereMap();
  } else {
    const hereJS = document.createElement('script');
    hereJS.src = `https://js.api.here.com/v3/3.1/mapsjs-core.js`;
    hereJS.onload = () => {
      const serviceJS = document.createElement('script');
      serviceJS.src = `https://js.api.here.com/v3/3.1/mapsjs-service.js`;
      serviceJS.onload = () => {
        const uiJS = document.createElement('script');
        uiJS.src = `https://js.api.here.com/v3/3.1/mapsjs-ui.js`;
        uiJS.onload = () => {
          const eventsJS = document.createElement('script');
          eventsJS.src = `https://js.api.here.com/v3/3.1/mapsjs-mapevents.js`;
          eventsJS.onload = initHereMap;
          document.body.appendChild(eventsJS);
        };
        document.body.appendChild(uiJS);
      };
      document.body.appendChild(serviceJS);
    };
    document.body.appendChild(hereJS);

    // HERE UI CSS
    if (!document.querySelector('link[href="https://js.api.here.com/v3/3.1/mapsjs-ui.css"]')) {
      const hereCSS = document.createElement('link');
      hereCSS.rel = 'stylesheet';
      hereCSS.href = 'https://js.api.here.com/v3/3.1/mapsjs-ui.css';
      document.head.appendChild(hereCSS);
    }
  }

  function initHereMap() {
    const platform = new H.service.Platform({ apikey: apiKey });
    const layers = platform.createDefaultLayers();

    const map = new H.Map(
      document.getElementById('hereMap'),
      layers.vector.normal.map,
      {
        zoom: 5,
        center: { lat: 25.023188632878277, lng: 77.47422871664293 }
      }
    );

    const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    const ui = H.ui.UI.createDefault(map, layers);
  }
}

