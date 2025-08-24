function loadHereWmsService() {
  const content = document.getElementById("main-content");
  content.innerHTML = `
    <h2 style="margin-top: 0px;margin-bottom: 0px;">HERE Maps WMS Loader</h2>
    <div id="hereMap" style="height: 600px; position: relative;"></div>

    <div id="wmsUI" class="wms-panel" style="top: 0px;margin-bottom: 0px;">
      <div class="wms-panel-header">
        <span style="margin-top: 0px;margin-bottom: 0px;"><strong>🌍 WMS Loader</strong></span>
        <button id="wmsToggleBtn" title="Collapse">&#9650;</button>
      </div>
      <div class="wms-panel-body collapsed">
        <label for="wmsCapabilitiesUrl">WMS URL:</label><br>
        <input type="text" id="wmsCapabilitiesUrl" placeholder="Enter WMS GetCapabilities URL"><br>
        <div style="margin-top:5px; display:flex; gap:5px;">
          <button id="fetchWMS" style="flex:1;">Fetch Layers</button>
          <button id="resetWMS" style="flex:1; background:#b71c1c; color:white;">Reset</button>
        </div>
        <select id="wmsLayerSelect" disabled></select>
        <button id="addFromSelect" disabled>Add Layer</button>
        <div id="dynamicLayerToggles"></div>
        <div id="wmsLegendContainer"></div>
      </div>
    </div>
  `;

  let map = null;
  const fetchedWMS = {};
  const dynamicLayers = {};

  // Collapse toggle
  const toggleBtn = document.getElementById("wmsToggleBtn");
  const panelBody = document.querySelector(".wms-panel-body");
  toggleBtn.addEventListener("click", () => {
    panelBody.classList.toggle("collapsed");
    toggleBtn.innerHTML = panelBody.classList.contains("collapsed") ? "&#9660;" : "&#9650;";
  });

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

  // Function to initialize HERE map
  function initHereMap() {
    const platform = new H.service.Platform({ apikey: "YOUR_HERE_API_KEY" });  // Replace with your HERE API key
    const layers = platform.createDefaultLayers();

    map = new H.Map(
      document.getElementById('hereMap'),
      layers.vector.normal.map,
      {
        zoom: 5,
        center: { lat: 25.023188632878277, lng: 77.47422871664293 } 
      }
    );
//25.023188632878277, 77.47422871664293 INDIA center 
    const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    const ui = H.ui.UI.createDefault(map, layers);
  }

  // Fetch WMS Layers
  document.getElementById("fetchWMS").onclick = async () => {
    const url = document.getElementById("wmsCapabilitiesUrl").value.trim();
    if (!url) return alert("Enter WMS GetCapabilities URL");

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(resp.status);
      const xml = await resp.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "application/xml");
      if (doc.querySelector("parsererror")) throw new Error("Invalid XML");

      const layers = [];
      doc.querySelectorAll("Layer > Name").forEach(n => {
        const name = n.textContent;
        const layerNode = n.parentNode;
        let bboxNode = layerNode.querySelector("LatLonBoundingBox, EX_GeographicBoundingBox");
        let bbox = null;
        if (bboxNode) {
          bbox = bboxNode.tagName === "LatLonBoundingBox"
            ? [
                [parseFloat(bboxNode.getAttribute("miny")), parseFloat(bboxNode.getAttribute("minx"))],
                [parseFloat(bboxNode.getAttribute("maxy")), parseFloat(bboxNode.getAttribute("maxx"))]
              ]
            : [
                [parseFloat(bboxNode.querySelector("southBoundLatitude").textContent), parseFloat(bboxNode.querySelector("westBoundLongitude").textContent)],
                [parseFloat(bboxNode.querySelector("northBoundLatitude").textContent), parseFloat(bboxNode.querySelector("eastBoundLongitude").textContent)]
              ];
        }
        layers.push({ name, bbox });
      });

      if (!layers.length) throw new Error("No layers found");

      const sel = document.getElementById("wmsLayerSelect");
      sel.innerHTML = `<option value="">-- select layer --</option>`;
      layers.forEach(l => sel.add(new Option(l.name, l.name)));
      sel.disabled = false;

      fetchedWMS.url = url;
      fetchedWMS.layers = layers.reduce((o, l) => (o[l.name] = l, o), {});
      document.getElementById("addFromSelect").disabled = true;

      sel.onchange = () => {
        document.getElementById("addFromSelect").disabled = !sel.value;
      };

      alert(`${layers.length} layers found.`);
    } catch (err) {
      console.error(err);
      alert("Fetch error: " + err.message);
    }
  };

  // Reset WMS UI
  document.getElementById("resetWMS").onclick = () => {
    document.getElementById("wmsCapabilitiesUrl").value = "";
    document.getElementById("wmsLayerSelect").innerHTML = "";
    document.getElementById("wmsLayerSelect").disabled = true;
    document.getElementById("addFromSelect").disabled = true;
    document.getElementById("dynamicLayerToggles").innerHTML = "";
    document.getElementById("wmsLegendContainer").innerHTML = "";
    Object.values(dynamicLayers).forEach(layer => map.remove(layer));
    for (let key in dynamicLayers) delete dynamicLayers[key];
    alert("WMS interface has been reset.");
  };

  // Add WMS Layer to Map
  document.getElementById("addFromSelect").onclick = () => {
    const name = document.getElementById("wmsLayerSelect").value;
    if (!name) return;

    const key = `WMS:${name}`;
    if (dynamicLayers[key]) return alert("Layer already added");

    const wms = new H.map.layer.ImageLayer({
      url: `${fetchedWMS.url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=${name}&STYLES=&SRS=EPSG:4326&WIDTH=256&HEIGHT=256&FORMAT=image/png`
    });
    map.addLayer(wms);
    dynamicLayers[key] = wms;

    // Layer toggle UI
    const c = document.createElement("div");
    c.className = "layer-toggle";
    const id = `toggle-${key}`;
    c.innerHTML = `
      <input type="checkbox" id="${id}" checked>
      <label for="${id}">${name}</label>
      <button class="layer-control-btn" title="Zoom to Layer">🔍</button>
      <button class="layer-control-btn" title="Remove Layer">✖</button>
    `;
    document.getElementById("dynamicLayerToggles").append(c);

    document.getElementById(id).addEventListener("change", e => {
      e.target.checked ? map.addLayer(wms) : map.removeLayer(wms);
    });

    c.querySelector("[title='Zoom to Layer']").addEventListener("click", () => {
      const b = fetchedWMS.layers[name].bbox;
      if (b) {
        const extent = new H.geo.Rect(b[0][1], b[0][0], b[1][1], b[1][0]);
        map.getViewModel().setLookAtData({ bounds: extent });
      }
    });

    c.querySelector("[title='Remove Layer']").addEventListener("click", () => {
      map.removeLayer(wms);
      delete dynamicLayers[key];
      c.remove();
    });
  };
}


