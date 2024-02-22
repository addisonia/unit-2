// Function to instantiate the Leaflet map
function createMap(){
    // Create the map and set its view to a given geographical coordinates and zoom level
    var map = L.map('map', {
        center: [37.8, -96], // Adjusted center to USA
        zoom: 4 // Adjusted zoom level to show the USA
    });

    // Add OpenStreetMap tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    // Call the getData function to load and display the GeoJSON data
    getData(map);
}

// Function to calculate the radius of the circle markers
function calcPropRadius(attValue) {
    // Adjust the scaleFactor to increase the size of the markers
    var scaleFactor = 0.0005; // Adjust this value to change the symbol sizes
    var area = attValue * scaleFactor;
    // Apply a square root to reduce the disparity in sizes
    return Math.sqrt(area/Math.PI) * 2; // The multiplier can be adjusted for further refinement
}



// Function to convert markers to circle markers and add popups
function pointToLayer(feature, latlng) {
    // Access the nested PopulationData for the year 2021
    var attribute = "PopulationData_2021";

    // Create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    // For each feature, determine its value for the selected attribute
    var attValue = feature.properties.PopulationData['2021']; // Access the nested value
    if (isNaN(attValue)) {
        attValue = 1; // Default value if attValue is NaN
    }

    options.radius = calcPropRadius(attValue); // Call the calcPropRadius function

    // Create circle marker layer
    var layer = L.circleMarker(latlng, options);

    // Build popup content string
    var popupContent = "<p><b>Entity Name:</b> " + feature.properties['Entity Name'] + "</p>";

    // Add formatted attribute to the popup content string
    popupContent += "<p><b>Population in 2021:</b> " + attValue + "</p>";

    // Bind the popup to the circle marker and add an offset
    layer.bindPopup(popupContent, {
        offset: new L.Point(0, -options.radius)
    });

    // Return the circle marker to the L.geoJson pointToLayer option
    return layer;
}

// Add circle markers for point features to the map
function createPropSymbols(data, map){
    // Create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: pointToLayer
    }).addTo(map);
}

// Function to retrieve the GeoJSON data and add it to the map with styling and popups
function getData(map){
    // Load the data with fetch, then add a GeoJSON layer to the map
    fetch("data/SacramentoRegionPop.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            // Call function to create proportional symbols
            createPropSymbols(json, map);
        });
}

// Event listener that runs the createMap function once the DOM is loaded
document.addEventListener('DOMContentLoaded', createMap);
