// Function to instantiate the Leaflet map
function createMap(){
    // Create the map and set its view to a given geographical coordinates and zoom level
    var map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    // Add OpenStreetMap tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    // Call the getData function to load and display the GeoJSON data
    getData(map);
}

// Function to attach popups to each mapped feature
function onEachFeature(feature, layer) {
    // Initialize an empty string for popup content
    var popupContent = "<b>" + feature.properties['Entity Name'] + "</b><br>";

    // Check if the PopulationData object exists and iterate over it
    if (feature.properties.PopulationData) {
        for (var year in feature.properties.PopulationData) {
            popupContent += "Population " + year + ": " + feature.properties.PopulationData[year] + "<br>";
        }
    }

    // Bind the popup with the generated content to the layer (circle marker)
    layer.bindPopup(popupContent);
}


// Function to retrieve the GeoJSON data and add it to the map with styling and popups
function getData(map){
    // Load the data with fetch, then add a GeoJSON layer to the map
    fetch("data/SacramentoRegionPop.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            // Define marker options for the circle markers
            var geojsonMarkerOptions = {
                radius: 7,
                fillColor: "#c7bee8",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };
            
            // Create a Leaflet GeoJSON layer, style it, and add it to the map
            L.geoJson(json, {
                pointToLayer: function (feature, latlng){
                    // Use the marker options to style each circle marker
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                },
                onEachFeature: onEachFeature // Use the onEachFeature function to bind popups
            }).addTo(map);
        });
}

// Event listener that runs the createMap function once the DOM is loaded
document.addEventListener('DOMContentLoaded', createMap);
