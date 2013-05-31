var map;
function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}
$(document).ready(function(){
  // make a Leaflet map
  map = new L.Map('map', { zoomControl: false, panControl: false });
  map.attributionControl.setPrefix('');
  L.control.pan().addTo(map);
  L.control.zoom().addTo(map);
  var toner = 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png';
  var tonerAttrib = 'Map data &copy;2013 OpenStreetMap contributors, Tiles &copy;2013 Stamen Design';
  terrainLayer = new L.TileLayer(toner, {maxZoom: 18, attribution: tonerAttrib});
  map.addLayer(terrainLayer);
  map.setView(new L.LatLng(32.076175,-81.095238), 14);

  // load same customgeo used to generate this map
  $.getJSON('/timeline-at.geojson?customgeo=' + customgeo, function(polys){
    var src = polys.source;
    var src_credits = "";
    switch(src){
      case "allegheny":
      case "pittsburgh":
        src_credits = ".allegheny";
        break;
      case "austin":
        src_credits = ".austin";
        break;
      case "baltimore":
        src_credits = ".baltimore";
        break;
      case "bloomington":
        src_credits = ".bloomington";
        break;
      case "boston":
        src_credits = ".boston";
        break;
      case "boulder":
        src_credits = ".boulder";
        break;
      case "chapelhill":
        src_credits = ".chapelhill";
        break;
      case "chicago":
        src_credits = ".chicago";
        break;
      case "clark":
        src_credits = ".clark";
        break;
      case "honolulu":
        src_credits = ".honolulu";
        break;
      case "kitsap":
        src_credits = ".kitsap";
        break;
      case "lancaster":
        src_credits = ".lancaster";
        break;
      case "midland":
      case "midlandtx":
        src_credits = ".midland";
        break;
      case "nanaimo":
        src_credits = ".nanaimo";
        break;
      case "oakland":
        src_credits = ".oakland";
        break;
      case "petaluma":
        src_credits = ".petaluma";
        break;
      case "philadelphia":
        src_credits = ".philadelphia";
        break;
      case "raleigh":
      case "wake":
        src_credits = ".raleigh";
        break;
      case "roundrock":
        src_credits = ".roundrock";
        break;
      case "sanfrancisco":
        src_credits = ".sanfrancisco";
        break;
      case "savannah":
      case "chatham":
      case "sagis":
        src_credits = ".savannah";
        break;
      case "seattle":
        src_credits = ".seattle";
        break;
      case "smith":
      case "tyler":
        src_credits = ".smith";
        break;
      case "spokane":
        src_credits = ".spokane";
        break;
      case "steamboatsprings":
        src_credits = ".steamboatsprings";
        break;
      case "westsacramento":
        src_credits = ".westsacramento";
        break;
    }
    $(src_credits).css({ "display": "block" });
    if(src_credits.length){
      $("#createyours").attr("href", "/draw/" + src_credits.replace(".",""));
    }
    
    var maxlat = -90;
    var minlat = 90;
    var maxlng = -180;
    var minlng = 180;
    for(var f=0;f<polys.features.length;f++){
      var coords = polys.features[f].geometry.coordinates[0];
      var avg = [0, 0];
      for(var c=0;c<coords.length;c++){
        maxlat = Math.max(maxlat, coords[c][1]);
        minlat = Math.min(minlat, coords[c][1]);
        maxlng = Math.max(maxlng, coords[c][0]);
        minlng = Math.min(minlng, coords[c][0]);
        avg[0] += coords[c][0];
        avg[1] += coords[c][1];
        //coords[c] = new L.LatLng(coords[c][1], coords[c][0]);
        coords[c].push( 100 ); // add a fixed height
      }
      avg[0] /= coords.length;
      avg[0] = avg[0].toFixed(6);
      avg[1] /= coords.length;
      avg[1] = avg[1].toFixed(6);
      var myid = avg.join(',') + "," + coords.length;

      //var poly = new L.polygon(coords, { weight: 2, color: "#0033ff" });
      var foundMatch = false;
      var erased = false;
      for(var p=0;p<edited.length;p++){
        if(edited[p].id == myid){
          // skip erased polygons
          if(edited[p].color && edited[p].color == 'erase'){
            erased = true;
            edited.splice(p,1);
            break;
          }
          foundMatch = true;
          if(edited[p].name || edited[p].description){
            //poly.bindPopup( '<h3>' + (edited[p].name || '') + '</h3>' + describe( ( edited[p].description || '') ) );
          }
          else{
            //poly.setStyle({ clickable: false });
          }
          if(edited[p].color){
            //poly.setStyle({ color: edited[p].color, opacity: 0.65 });
          }
          edited.splice(p,1);
          break;
        }
      }
      if(!erased){

        var geoJSONData = {
          "type": "FeatureCollection",
          "features": [{
            "type": "Feature",
            "geometry": {
              "type": "Polygon",
              "coordinates": [ coords ]
            },
            "properties": {
              "color": (edited[p].color || "")
            }
          }]
        };
        new L.BuildingsLayer().addTo(map).geoJSON(geoJSONData);

        if(!foundMatch){
          // unedited building
          //poly.setStyle({ clickable: false });
        }
      }
    }
    if(polys.features.length){
      map.fitBounds( new L.LatLngBounds( new L.LatLng(minlat, minlng), new L.LatLng(maxlat, maxlng) ) );
    }
    
  });
});
function replaceAll(src, oldr, newr){
  while(src.indexOf(oldr) > -1){
    src = src.replace(oldr, newr);
  }
  return src;
}
function describe(description){
  if((typeof description == 'undefined') || (!description)){
    return "";
  }
  description = replaceAll(description, "SETPIC:", "photo:");
  description = replaceAll(description, "SETVID:", "video:"); 
  
  // allow link:http://example.com
  while(description.indexOf("link:") > -1){
    description = description.split("link:");
    if(description[1].indexOf(" ") > -1){
      description[1] = "<a href='" + description[1].split(" ")[0] + "'>" + description[1].split(" ")[0] + "</a> " + description[1].split(" ").slice(1);
    }
    else{
      description[1] = "<a href='" + description[1] + "'>" + description[1] + "</a>";
    }
    description = description.join("link:");
    description = description.replace("link:","");
  }
  // allow photo:http://example.com/image.jpg
  // or img:http://example.com/image.jpg
  // or pic:http://example.com/image.jpg
  description = replaceAll(description, "img:", "photo:");
  description = replaceAll(description, "pic:", "photo:");
  while(description.indexOf("photo:") > -1){
    description = description.split("photo:");
    if(description[1].indexOf(" ") > -1){
      description[1] = "<br/><img src='" + description[1].split(" ")[0] + "' width='250'/><br/>" + description[1].split(" ").slice(1);
    }
    else{
      description[1] = "<br/><img src='" + description[1] + "' width='250'/>";
    }
    description = description.join("photo:");
    description = description.replace("photo:","");
  }
  // allow video:http://youtube.com/watch?v=t4oYs1aTD-4
  while(description.indexOf("video:") > -1){
    description = description.split("video:");
    if(description[1].indexOf(" ") > -1){
      description[1] = "<br/><iframe title='YouTube video player' width='280' height='230' src='http://" + replaceAll(replaceAll(replaceAll(description[1].split(" ")[0], "http://",""), "https://", ""),"/watch?v=","/embed/") + "' frameborder='0' allowfullscreen></iframe><br/>" + description[1].split(" ").slice(1);
    }
    else{
      description[1] = "<br/><iframe title='YouTube video player' width='280' height='230' src='http://" + replaceAll(replaceAll(replaceAll(description[1], "http://",""), "https://", ""),"/watch?v=","/embed/") + "' frameborder='0' allowfullscreen></iframe>";
    }
    description = description.join("video:");
    description = description.replace("video:","");
  }
  return '<p>' + description + '</p>';
}
function downloadFile(format){
  if(format == 1){ 
    // GeoJSON
    window.location = "/savemap/" + savemapid + ".geojson";
  }
  else if(format == 0){
    // KML
    window.location = "/savemap/" + savemapid + ".kml";
  }
}
function zoomByAbout(e) {
  var x = .5*$('#map').width(),
  y = .5*$('#map').height(),
  mouse_point = e.containerPoint,
  new_center_point = new L.Point((x + mouse_point.x) / 2, (y + mouse_point.y) / 2),
  new_center_location = map.containerPointToLatLng(new_center_point);
  map.setView(new_center_location, map.getZoom() + 1); 
}
function showDataSource(){
  $("#creditmessage").modal("toggle");
}