function loadArcGISWMSLoader() {
  const content = document.getElementById("main-content");
  content.innerHTML = `
    <h2 style="margin-top: 0px;margin-bottom: 0px;">Add WMS Service</h2>
    <div id="arcgisMap" style="height: 600px; position: relative;"></div>

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
  // Load ArcGIS CSS if not loaded
  if (!document.querySelector('link[href="https://js.arcgis.com/4.29/esri/themes/light/main.css"]')) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://js.arcgis.com/4.29/esri/themes/light/main.css";
    document.head.appendChild(css);
  }

  const initArcGIS = () => {
    require([
      "esri/Map",
      "esri/views/MapView",
      "esri/layers/WMSLayer",
      "esri/geometry/Extent"
    ], (Map, MapView, WMSLayer, Extent) => {
      const map = new Map({ basemap: "streets-navigation-vector" });
      const view = new MapView({
        container: "arcgisMap",
        map: map,
        center: [78.9, 20.5],
        zoom: 3
      });

      // Collapse toggle
      const toggleBtn = document.getElementById("wmsToggleBtn");
      const panelBody = document.querySelector(".wms-panel-body");
      toggleBtn.addEventListener("click", () => {
        panelBody.classList.toggle("collapsed");
        toggleBtn.innerHTML = panelBody.classList.contains("collapsed") ? "&#9660;" : "&#9650;";
      });

      const fetchedWMS = {};
      const dynamicLayers = {};

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

        const wms = new WMSLayer({
          url: fetchedWMS.url,
          sublayers: [{ name: name }]
        });
        map.add(wms);
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
          e.target.checked ? map.add(wms) : map.remove(wms);
        });

        c.querySelector("[title='Zoom to Layer']").addEventListener("click", () => {
          const b = fetchedWMS.layers[name].bbox;
          if (b) {
            const extent = new Extent({
              xmin: b[0][1],
              ymin: b[0][0],
              xmax: b[1][1],
              ymax: b[1][0],
              spatialReference: { wkid: 4326 }
            });
            view.goTo(extent);
          }
        });

        c.querySelector("[title='Remove Layer']").addEventListener("click", () => {
          map.remove(wms);
          delete dynamicLayers[key];
          c.remove();
          document.getElementById(`legend-${key}`)?.remove();
        });

        // Legend image
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
  };

  if (typeof require !== "undefined" && require.on) {
    initArcGIS();
  } else {
    const arcgisJS = document.createElement("script");
    arcgisJS.src = "https://js.arcgis.com/4.29/";
    arcgisJS.onload = initArcGIS;
    document.body.appendChild(arcgisJS);
  }
}
