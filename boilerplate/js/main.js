
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
    if (!attValue || isNaN(attValue) || attValue <= 0) {
        console.error("Invalid attValue for radius calculation:", attValue);
        return 0; // Return a default minimum size for the circle radius
    }
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
    var populationData = data.features[0].properties.PopulationData;
    for (var year in populationData) {
        attributes.push(year);
    }

    return attributes.sort(function(a, b) {
        return parseInt(a) - parseInt(b); // Sorting years numerically
    });
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
function updatePropSymbols(map, attribute) {
    map.eachLayer(function(layer) {
        if (layer.feature && layer.feature.properties.PopulationData) {
            var props = layer.feature.properties;
            var attValue = props.PopulationData[attribute];
            if (typeof attValue === 'number' && !isNaN(attValue)) {
                var radius = calcPropRadius(attValue);
                layer.setRadius(radius);
                var popupContent = "<p><b>Entity Name:</b> " + props['Entity Name'] + "</p>" +
                                   "<p><b>Population in " + attribute + ":</b> " + attValue + "</p>";
                layer.getPopup().setContent(popupContent);
            }
        }
    });
}



var dataStats = {};

// Define the calcStats function
function calcStats(data) {
    var allValues = [];
    // Loop through each feature in the dataset
    data.features.forEach(function(feature) {
        // Now we need to access the PopulationData object
        var populationData = feature.properties.PopulationData;
        for (var year in populationData) {
            var value = populationData[year];
            // Ensure the value is a number and not NaN
            if (typeof value === 'number' && !isNaN(value)) {
                allValues.push(value);
            }
        }
    });

    // Calculate min, max, mean from allValues
    if (allValues.length > 0) {
        dataStats.min = Math.min(...allValues);
        dataStats.max = Math.max(...allValues);
        var sum = allValues.reduce((a, b) => a + b, 0);
        dataStats.mean = sum / allValues.length;
    } else {
        console.error("No valid numeric values found in the dataset");
    }
}






function getData(map){
    fetch("data/SacramentoRegionPop.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            // Attributes are obtained here and must be passed to calcStats
            var attributes = processData(json);
            createPropSymbols(json, map, attributes);
            createSequenceControls(map, attributes);
            calcStats(json); // Pass attributes to calcStats
            createLegend(map, attributes); // Pass attributes to createLegend
        });
}




function createLegend(map, attributes) {
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        onAdd: function() {
            var container = L.DomUtil.create('div', 'legend-control-container');
            container.innerHTML = '<p class="temporalLegend">Population in <span class="year">2015-2021</span></p>';

            // Start building the SVG string
            var svgStart = '<svg id="attribute-legend" width="160px" height="60px">';
            var circles = ["max", "mean", "min"];
            var svgContent = "";

            // Loop through each circle and add it to the SVG string
            circles.forEach(circle => {
                var radius = calcPropRadius(dataStats[circle]);
                var cy = 60 - radius; // Adjust for visualization
                svgContent += `<circle class="legend-circle" id="${circle}" r="${radius}" cy="${cy}" cx="30" fill="#F47821" fill-opacity="0.8" stroke="#000000"/>`;
            });

            // Loop through each text element and add it to the SVG string
            circles.forEach((circle, i) => {
                var textY = i * 20 + 20;
                svgContent += `<text id="${circle}-text" x="75" y="${textY}">${Math.round(dataStats[circle] * 100) / 100} million</text>`;
            });

            var svgEnd = '</svg>';
            // Combine everything into a single SVG string
            var svg = svgStart + svgContent + svgEnd;

            // Set the innerHTML of the container to the combined SVG string
            container.innerHTML += svg;

            return container;
        }
    });

    map.addControl(new LegendControl());
}




document.addEventListener('DOMContentLoaded', createMap);

