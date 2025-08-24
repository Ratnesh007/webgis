function loadLeafletWmsServiceMap() {
  const content = document.getElementById("main-content");
  content.innerHTML = `
    <h2 style="margin-top: 0px;margin-bottom: 0px;">Leaflet WMS Loader</h2>
    <div id="leafletMap" style="height: 600px; width: 100%; position: relative;"></div>

    <!-- WMS Panel -->
    <div id="wmsUI" class="wms-panel" style="top: 0px;margin-bottom: 0px;">
      <div class="wms-panel-header">
        <span style="margin-top: 0px;margin-bottom: 0px;"><strong>WMS Loader</strong></span>
        <button id="wmsToggleBtn" title="Expand">&#9660;</button>
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

  // Append panel inside map div
  // document.getElementById("leafletMap").appendChild(document.getElementById("wmsUI"));

  // Load Leaflet if not already loaded
  function initLeaflet() {
    const map = L.map("leafletMap").setView([25.023188632878277, 77.47422871664293], 3); //india;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    const fetchedWMS = {};
    const dynamicLayers = {};

    // Collapsible panel
    const toggleBtn = document.getElementById("wmsToggleBtn");
    const panelBody = document.querySelector(".wms-panel-body");
    toggleBtn.addEventListener("click", () => {
      panelBody.classList.toggle("collapsed");
      toggleBtn.innerHTML = panelBody.classList.contains("collapsed") ? "&#9660;" : "&#9650;";
    });

    // Fetch WMS Capabilities
    document.getElementById("fetchWMS").onclick = async () => {
      const url = document.getElementById("wmsCapabilitiesUrl").value.trim();
      if (!url) return alert("Enter WMS GetCapabilities URL");

      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(resp.status);
        const xml = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "application/xml");

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
        sel.onchange = () => document.getElementById("addFromSelect").disabled = !sel.value;
        alert(`${layers.length} layers found.`);
      } catch (err) {
        console.error(err);
        alert("Fetch error: " + err.message);
      }
    };

    // Add Layer
    document.getElementById("addFromSelect").onclick = () => {
      const name = document.getElementById("wmsLayerSelect").value;
      if (!name) return;
      const key = `WMS:${name}`;
      if (dynamicLayers[key]) return alert("Layer already added");

      const wms = L.tileLayer.wms(fetchedWMS.url.split("?")[0], {
        layers: name,
        format: "image/png",
        transparent: true,
        version: "1.1.1",
        attribution: "WMS Layer"
      }).addTo(map);

      dynamicLayers[key] = wms;

      // Add toggle UI
      const c = document.createElement("div");
      c.className = "layer-toggle";
      const id = `toggle-${key}`;
      c.innerHTML = `
        <input type="checkbox" id="${id}" checked>
        <label for="${id}">${key}</label>
        <button class="layer-control-btn" title="Zoom to Layer">🔍</button>
        <button class="layer-control-btn" title="Remove Layer">✖</button>
      `;
      document.getElementById("dynamicLayerToggles").append(c);

      // Checkbox toggle
      document.getElementById(id).addEventListener("change", e => {
        if (e.target.checked) {
          map.addLayer(wms);
        } else {
          map.removeLayer(wms);
        }
      });

      // Zoom to layer
      c.querySelector("[title='Zoom to Layer']").addEventListener("click", () => {
        const b = fetchedWMS.layers[name].bbox;
        if (b) map.fitBounds(b);
      });

      // Remove layer
      c.querySelector("[title='Remove Layer']").addEventListener("click", () => {
        map.removeLayer(wms);
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

    // Reset
    document.getElementById("resetWMS").onclick = () => {
      Object.values(dynamicLayers).forEach(layer => map.removeLayer(layer));
      document.getElementById("dynamicLayerToggles").innerHTML = "";
      document.getElementById("wmsLegendContainer").innerHTML = "";
      document.getElementById("wmsLayerSelect").innerHTML = "";
      document.getElementById("wmsLayerSelect").disabled = true;
      document.getElementById("addFromSelect").disabled = true;
      map.setView([25.023188632878277, 77.47422871664293], 3);
    };
  }

  if (typeof L !== "undefined") {
    initLeaflet();
  } else {
    const leafletCSS = document.createElement("link");
    leafletCSS.rel = "stylesheet";
    leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(leafletCSS);

    const leafletJS = document.createElement("script");
    leafletJS.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    leafletJS.onload = initLeaflet;
    document.body.appendChild(leafletJS);
  }
}
