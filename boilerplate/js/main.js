
// Function to instantiate the Leaflet map
function createMap(){
    var map = L.map('map', {
        center: [38.5816, -121.4944], // Coordinates for Sacramento
        zoom: 7 // Adjusted zoom level for closer view
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    getData(map);
}

function calcPropRadius(attValue) {
    var scaleFactor = 0.0005;
    var area = attValue * scaleFactor;
    return Math.sqrt(area/Math.PI) * 2;
}

// Update this function to dynamically use the selected attribute
function pointToLayer(feature, latlng, attributes){
    var attribute = attributes[0]; // Default to the first attribute
    var attValue = feature.properties.PopulationData[attribute];

    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
        radius: calcPropRadius(attValue)
    };

    var layer = L.circleMarker(latlng, options);

    var popupContent = "<p><b>County Name:</b> " + feature.properties['Entity Name'] + "</p>";
    popupContent += "<p><b>Population in " + attribute + ":</b> " + attValue + "</p>";
    layer.bindPopup(popupContent, {
        offset: new L.Point(0, -options.radius)
    });

    return layer;
}

function createPropSymbols(data, map, attributes){
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
}

function processData(data){
    var attributes = [];
    var exampleProperties = data.features[0].properties.PopulationData;
    for (var attribute in exampleProperties) {
        attributes.push(attribute);
    }
    return attributes.sort(); // Make sure to sort the years if necessary
}

function createSequenceControls(map, attributes){
    // Use the existing slider
    var slider = document.querySelector('.range-slider');
    slider.min = 0;
    slider.max = attributes.length - 1;
    slider.value = 0;
    slider.step = 1;

    // Update the event listener to use the existing slider
    slider.addEventListener('input', function(){
        var index = this.value;
        updatePropSymbols(map, attributes[index]);
    });

    // Attach event listeners to the existing forward and reverse buttons
    document.querySelector('#forward').addEventListener('click', function(){
        if(slider.value < slider.max) {
            slider.value++;
        } else {
            slider.value = 0; // Wrap around to the beginning
        }
        updatePropSymbols(map, attributes[slider.value]);
    });

    document.querySelector('#reverse').addEventListener('click', function(){
        if(slider.value > 0) {
            slider.value--;
        } else {
            slider.value = slider.max; // Wrap around to the end
        }
        updatePropSymbols(map, attributes[slider.value]);
    });
}


// Function to update the symbols and popups based on the selected attribute
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties.PopulationData[attribute]){
            var props = layer.feature.properties;
            var radius = calcPropRadius(props.PopulationData[attribute]);
            layer.setRadius(radius);

            var popupContent = "<p><b>Entity Name:</b> " + props['Entity Name'] + "</p>";
            popupContent += "<p><b>Population in " + attribute + ":</b> " + props.PopulationData[attribute] + "</p>";
            layer.getPopup().setContent(popupContent);
        }
    });
}

function getData(map){
    fetch("data/SacramentoRegionPop.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var attributes = processData(json);
            createPropSymbols(json, map, attributes);
            createSequenceControls(map, attributes);
        });
}

document.addEventListener('DOMContentLoaded', createMap);

