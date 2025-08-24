function loadWmsServiceCesiumMap() {
  const content = document.getElementById("main-content");
  content.innerHTML = `
    <h2 style="margin-top: 0px;margin-bottom: 0px;">Cesium WMS Loader</h2>
    <div id="cesiumContainer" style="height: 600px; width: 100%; position: relative;"></div>
    <div id="wmsUI" class="wms-panel" style="top: 0px;margin-bottom: 0px;">
      <div class="wms-panel-header">
        <span style="margin-top: 0px;margin-bottom: 0px;"><strong>WMS Loader</strong></span>
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
  
  // CSS for collapsible panel
 /* const style = document.createElement("style");
  style.innerHTML = `
    .wms-panel {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 99;
      background: white;
      border-radius: 5px;
      box-shadow: 0 0 5px rgba(0,0,0,0.3);
      overflow: hidden;
      width: 290px;
      font-family: sans-serif;
    }
    .wms-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1976d2;
      color: white;
      padding: 6px 10px;
      cursor: pointer;
    }
    .wms-panel-header button {
      background: transparent;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
    }
    .wms-panel-body {
      padding: 10px;
      display: block;
      transition: max-height 0.3s ease;
    }
    .wms-panel-body.collapsed {
      display: none;
    }
    #wmsCapabilitiesUrl, #wmsLayerSelect {
      width: 100%;
      margin-top: 5px;
    }
    #fetchWMS, #addFromSelect, #resetWMS {
      margin-top: 5px;
      cursor: pointer;
    }
    .layer-toggle {
      margin-top: 5px;
      font-size: 14px;
    }
    .layer-control-btn {
      margin-left: 5px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
*/

  function initCesium() {
    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkNmY3ODRmYi1jMGNiLTQzOGYtYmVkZi1jNWY3NGY0Yjc3ZDgiLCJpZCI6NjQwNjYsImlhdCI6MTYyODc3MjAwNn0.jbTQVkW7HYJaLaMmzeRtDEwnbtwrQ8gs_velaUUjdZg";

    Cesium.CesiumTerrainProvider.fromIonAssetId(1).then(terrain => {
      const viewer = new Cesium.Viewer("cesiumContainer", {
        terrainProvider: terrain,
        baseLayerPicker: true,
        timeline: false,
        animation: false
      });

      // Default camera position (Ahmedabad, India)
      function resetCamera() {
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(77.47422871664293, 25.023188632878277, 20000000.0) //india , 
        });
      }
      resetCamera();

      const fetchedWMS = {};
      const dynamicLayers = {};

      // Collapsible Panel
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
        Object.values(dynamicLayers).forEach(layer => viewer.imageryLayers.remove(layer));
        for (let key in dynamicLayers) delete dynamicLayers[key];
        resetCamera(); // 🔄 Reset camera to Ahmedabad
        alert("WMS interface has been reset.");
      };

      // Add WMS Layer
      document.getElementById("addFromSelect").onclick = () => {
        const name = document.getElementById("wmsLayerSelect").value;
        if (!name) return;

        const key = `WMS:${name}`;
        if (dynamicLayers[key]) return alert("Layer already added");

        const wmsProvider = new Cesium.WebMapServiceImageryProvider({
  url: fetchedWMS.url.split("?")[0],   // remove query params
  layers: name,
  parameters: {
    service: "WMS",
    version: "1.1.1",                  // GeoServer works best with 1.1.1
    request: "GetMap",
    styles: "",
    format: "image/png",
    transparent: true,
    srs: "EPSG:4326"                   // important for Cesium compatibility
  },
  tilingScheme: new Cesium.GeographicTilingScheme(), // ensure 4326 projection
  maximumLevel: 20
});

        const wmsLayer = viewer.imageryLayers.addImageryProvider(wmsProvider);
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
            viewer.imageryLayers.add(dynamicLayers[key]);
          } else {
            viewer.imageryLayers.remove(dynamicLayers[key], false);
          }
        });

        c.querySelector("[title='Zoom to Layer']").addEventListener("click", () => {
          const b = fetchedWMS.layers[name].bbox;
          if (b) {
            viewer.camera.flyTo({
              destination: Cesium.Rectangle.fromDegrees(
                b[0][1], b[0][0], b[1][1], b[1][0]
              )
            });
          }
        });

        c.querySelector("[title='Remove Layer']").addEventListener("click", () => {
          viewer.imageryLayers.remove(dynamicLayers[key]);
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
    });
  }

  if (typeof Cesium !== "undefined") {
    initCesium();
  } else {
    const script = document.createElement("script");
    script.src = "https://cesium.com/downloads/cesiumjs/releases/1.114/Build/Cesium/Cesium.js";
    script.onload = initCesium;
    document.body.appendChild(script);

    if (!document.querySelector("link[href*='Cesium.css']")) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://cesium.com/downloads/cesiumjs/releases/1.114/Build/Cesium/Widgets/widgets.css";
      document.head.appendChild(css);
    }
  }
}
