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

// Function to retrieve the GeoJSON data and add it to the map
function getData(map){
    // Load the data with fetch, then add a GeoJSON layer to the map
    fetch("data/MegaCities.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            // Create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(json, {
                onEachFeature: function(feature, layer) {
                    // Bind popups to each feature, for example, displaying the city's name
                    layer.bindPopup(feature.properties.City);
                }
            }).addTo(map);
        });
}

// Event listener that runs the createMap function once the DOM is loaded
document.addEventListener('DOMContentLoaded', createMap);
