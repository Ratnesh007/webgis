function loadOpenLayersWMSLoader() {
  const content = document.getElementById("main-content");
  content.innerHTML = `
    <h2 style="margin-top: 0px;margin-bottom: 0px;">OpenLayers WMS Loader</h2>
    <div id="olMap" style="height: 600px; position: relative;"></div>

    <div id="wmsUI" class="wms-panel">
      <div class="wms-panel-header">
        <span><strong>WMS Loader</strong></span>
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

  if (!document.querySelector('link[href*="ol.css"]')) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdn.jsdelivr.net/npm/ol@v10.6.0/ol.css";
    document.head.appendChild(css);
  }

  const initOpenLayers = () => {
    const { Map, View } = ol;
    const TileLayer = ol.layer.Tile;
    const TileWMS = ol.source.TileWMS;
    const OSM = ol.source.OSM;
    const proj = ol.proj;

    const map = new Map({
      target: "olMap",
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({
        center: proj.fromLonLat([77.47422871664293, 25.023188632878277]), // India
        zoom: 4
      })
    });

    const fetchedWMS = {};
    const dynamicLayers = {};

    // Collapsible UI
    const toggleBtn = document.getElementById("wmsToggleBtn");
    const panelBody = document.querySelector(".wms-panel-body");
    toggleBtn.addEventListener("click", () => {
      panelBody.classList.toggle("collapsed");
      toggleBtn.innerHTML = panelBody.classList.contains("collapsed") ? "&#9660;" : "&#9650;";
    });

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
      Object.values(dynamicLayers).forEach(layer => map.removeLayer(layer));
      for (let key in dynamicLayers) delete dynamicLayers[key];
      alert("WMS interface has been reset.");
    };

    // Add WMS Layer
    document.getElementById("addFromSelect").onclick = () => {
      const name = document.getElementById("wmsLayerSelect").value;
      if (!name) return;

      const key = `WMS:${name}`;
      if (dynamicLayers[key]) return alert("Layer already added");

      const wmsSource = new TileWMS({
        url: fetchedWMS.url,
        params: { LAYERS: name, TILED: true },
        serverType: "geoserver",
        crossOrigin: "anonymous"
      });

      const wmsLayer = new TileLayer({ source: wmsSource });
      map.addLayer(wmsLayer);
      dynamicLayers[key] = wmsLayer;

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
        if (e.target.checked) {
          map.addLayer(wmsLayer);
        } else {
          map.removeLayer(wmsLayer);
        }
      });

      c.querySelector("[title='Zoom to Layer']").addEventListener("click", () => {
        const b = fetchedWMS.layers[name].bbox;
        if (b) {
          const extent = proj.transformExtent(
            [b[0][1], b[0][0], b[1][1], b[1][0]],
            "EPSG:4326",
            map.getView().getProjection()
          );
          map.getView().fit(extent, { size: map.getSize() });
        }
      });

      c.querySelector("[title='Remove Layer']").addEventListener("click", () => {
        map.removeLayer(wmsLayer);
        delete dynamicLayers[key];
        c.remove();
        document.getElementById(`legend-${key}`)?.remove();
      });

      // Legend
      const legendContainer = document.getElementById("wmsLegendContainer");
      const div = document.createElement("div");
      div.id = `legend-${key}`;
      div.style.marginBottom = "10px";
      const img = document.createElement("img");
      img.src = `${fetchedWMS.url.split("?")[0]}?service=WMS&version=1.1.1&request=GetLegendGraphic&format=image/png&layer=${name}`;
      div.innerHTML = `<div><strong>${name}</strong></div>`;
      div.append(img);
      legendContainer.append(div);
    };

    // Identify Tool
    map.on("singleclick", function (evt) {
      const viewResolution = map.getView().getResolution();
      let queryLayers = Object.keys(dynamicLayers);
      if (!queryLayers.length) {
        alert("No active WMS layers.");
        return;
      }

      let resultsHTML = "";
      queryLayers.forEach(key => {
        const layer = dynamicLayers[key];
        const source = layer.getSource();
        const sublayerName = key.replace("WMS:", "");

        const url = source.getFeatureInfoUrl(
          evt.coordinate,
          viewResolution,
          map.getView().getProjection(),
          { INFO_FORMAT: "application/json", FEATURE_COUNT: 5 }
        );

        if (url) {
          fetch(url)
            .then(r => r.json())
            .then(json => {
              if (json.features && json.features.length) {
                resultsHTML += `<h4>${sublayerName}</h4><pre>${JSON.stringify(json.features, null, 2)}</pre><hr>`;
                if (resultsHTML) {
                  alert(resultsHTML); // Replace with nicer popup if needed
                }
              }
            })
            .catch(err => console.warn(`FeatureInfo failed for ${sublayerName}`, err));
        }
      });
    });
  };

  if (typeof ol !== "undefined") {
    initOpenLayers();
  } else {
    const olScript = document.createElement("script");
    olScript.src = "https://cdn.jsdelivr.net/npm/ol@v10.6.0/dist/ol.js";
    olScript.onload = initOpenLayers;
    document.body.appendChild(olScript);
  }
}
