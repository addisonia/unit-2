// Initialize a map object and set its view to the given geographical coordinates and zoom level.
var map = L.map('map').setView([51.505, -0.09], 13);

// Add a tile layer to the map, specifying the URL template, maximum zoom level, and attribution text.
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Create a marker at the given position and add it to the map.
var marker = L.marker([51.5, -0.09]).addTo(map);

// Create a circle with a specified center, options for style, and add it to the map.
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);

// Create a polygon with the given vertices and add it to the map.
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

// Bind a popup with HTML content to the marker and immediately open it.
marker.bindPopup("<strong>Hello world!</strong><br />I am a popup.").openPopup();

// Bind popups with simple text content to the circle and polygon.
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");

// Initialize a popup, set its geographical coordinates, content, and add it to the map.
var popup = L.popup()
    .setLatLng([51.5, -0.09])
    .setContent("I am a standalone popup.")
    .openOn(map);

// Create an empty popup to be used later.
var popup = L.popup();

// Define an event listener for the 'click' event on the map, which will open a popup at the clicked location.
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}

// Attach the event listener defined above to the map.
map.on('click', onMapClick);
