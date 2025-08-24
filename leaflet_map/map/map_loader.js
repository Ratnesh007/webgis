function loadLeafletMap() {
  const content = document.getElementById('main-content');
  content.innerHTML = `
    <h2 style="margin-top: 0px;margin-bottom: 0px;">Leaflet Map</h2>
    <div id="leafletMap" style="height: 600px;"></div>
  `;

  const leafletCSSHref = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  const leafletScriptSrc = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

  // Load Leaflet CSS if not already present
  if (!document.querySelector(`link[href="${leafletCSSHref}"]`)) {
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = leafletCSSHref;
    document.head.appendChild(leafletCSS);
  }

  // Function to initialize map
  const initLeafletMap = () => {
    const map = L.map('leafletMap').setView([25.023188632878277, 77.47422871664293], 3); //india 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  };

  // Check if script already exists or L is defined
  if (typeof L !== 'undefined') {
    initLeafletMap();
  } else if (!document.querySelector(`script[src="${leafletScriptSrc}"]`)) {
    // Load script dynamically
    const leafletScript = document.createElement('script');
    leafletScript.src = leafletScriptSrc;
    leafletScript.onload = initLeafletMap;
    document.body.appendChild(leafletScript);
  } else {
    // Script is already being loaded — wait until it’s available
    const checkLeafletReady = setInterval(() => {
      if (typeof L !== 'undefined') {
        clearInterval(checkLeafletReady);
        initLeafletMap();
      }
    }, 50); // Check every 50ms
  }
}
