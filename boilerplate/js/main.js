
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

function createSequenceControls(map, attributes) {
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft' // Position the control at the bottom left corner of the map
        },

        onAdd: function(map) {
            // Create the control container with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');
            L.DomEvent.disableClickPropagation(container);

            // Create range input element (slider) and insert it into the container
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range" min="0" max="' + (attributes.length - 1) + '" value="0" step="1">');

            // Create skip buttons and insert them into the container
            container.insertAdjacentHTML('beforeend', '<button class="skip" id="reverse" title="Reverse"><img src="boilerplate/lib/images/reverse.png"></button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="skip" id="forward" title="Forward"><img src="boilerplate/lib/images/forward.png"></button>');

            // Add event listeners after adding the control to make sure elements exist
            var slider = container.querySelector('.range-slider');
            var reverse = container.querySelector('#reverse');
            var forward = container.querySelector('#forward');

            slider.addEventListener('input', function() {
                updatePropSymbols(map, attributes[this.value]);
            });

            reverse.addEventListener('click', function() {
                if (slider.value > 0) {
                    slider.value--;
                } else {
                    slider.value = attributes.length - 1; // Wrap to the last attribute
                }
                updatePropSymbols(map, attributes[slider.value]);
            });

            forward.addEventListener('click', function() {
                if (slider.value < attributes.length - 1) {
                    slider.value++;
                } else {
                    slider.value = 0; // Wrap to the first attribute
                }
                updatePropSymbols(map, attributes[slider.value]);
            });

            return container;
        }
    });

    map.addControl(new SequenceControl());
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


function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'legend-control-container');
            // Your code to populate the legend based on the current attribute

            return container;
        }
    });

    map.addControl(new LegendControl());
}

document.addEventListener('DOMContentLoaded', createMap);

