
/* Load Maps Dynamically */
function loadMap(type) {
  const content = document.getElementById('main-content');
  content.innerHTML = '';
  const cleanUp = () => {
    document.querySelectorAll('.dynamic-map-script, .dynamic-map-style').forEach(el => el.remove());
  };
  cleanUp();

switch (type) {
/* leaflet loader strat*/	
case 'leafletmap':
  loadLeafletMap();
  break;
   
case 'leafletdwms':
  loadLeafletWmsServiceMap();
  break;
/* leaflet loader end*/

/* openlayer loader strat*/
case 'openlayersmap':
  loadOpenLayersMap();
  break;
  
case 'openlayersdwms':  
  loadOpenLayersWMSLoader();
  break;
/* openlayer loader end*/

/* arcgis loader strat*/
 
case 'arcgismap':
  loadArcGISMap();
  break;
  
  case 'arcgisdwms':
  loadArcGISWMSLoader();
  break;
  
case 'arcgisbasemapgallery':
  loadArcGISBaseMapGallery();
  break;
/* arcgis loader end*/

/* cesium loader strat*/
case 'cesiumdwms':
  loadWmsServiceCesiumMap();
  break;
  
case 'cesiummap':
  loadCesiumMap();
  break;
/* cesium loader end*/  

/* here loader strat*/ 
case 'heremap':
  loadHereMap();
  break;
  
case 'herewms':
  loadHereWmsService();
  break;
  
/* here loader end*/

  }
}
