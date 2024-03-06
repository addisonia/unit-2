
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
                var popupContent = "<p><b>County Name:</b> " + props['Entity Name'] + "</p>" +
                                   "<p><b>Population in " + attribute + ":</b> " + attValue + "</p>";
                layer.getPopup().setContent(popupContent);
            }

            
        }
        updateLegend(map, attribute);
    });
}



var dataStats = {};

// Define the calcStats function
function calcStats(data, attributes) {
    dataStats.min = {};
    dataStats.max = {};
    dataStats.mean = {};

    // Iterate over each attribute and calculate stats
    attributes.forEach(attribute => {
        let values = data.features.map(feature => feature.properties.PopulationData[attribute]).filter(val => val);
        if(values.length > 0) {
            dataStats.min[attribute] = Math.min(...values);
            dataStats.max[attribute] = Math.max(...values);
            dataStats.mean[attribute] = values.reduce((sum, value) => sum + value) / values.length;
        } else {
            dataStats.min[attribute] = 0;
            dataStats.max[attribute] = 0;
            dataStats.mean[attribute] = 0;
        }
    });
}



function getData(map) {
    fetch("data/SacramentoRegionPop.geojson")
      .then(response => response.json())
      .then(json => {
        let attributes = processData(json);
        calcStats(json, attributes); // Make sure data and attributes are available
        createPropSymbols(json, map, attributes);
        createSequenceControls(map, attributes);
        updateLegend(map, attributes[0]); // Initialize the legend
      });
  }
  



function createLegend(map, currentAttribute) {
    // This will create the legend based on the current attribute (year)
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'legend-control-container');
            container.innerHTML = `<p class="temporalLegend">Population in <span class="year">${currentAttribute}</span></p>`;

            // Start the SVG string
            var svgStart = '<svg id="attribute-legend" width="160px" height="60px">';
            
            // Object to hold circle values for max, mean, and min
            var circleValues = {
                max: dataStats.max[currentAttribute],
                mean: dataStats.mean[currentAttribute],
                min: dataStats.min[currentAttribute]
            };

            // Strings to hold SVG content for circles and text
            var svgCircles = '';
            var svgTexts = '';

            // Iterate through max, mean, min
            Object.keys(circleValues).forEach((key, index) => {
                // Calculate the radius of the circle using calcPropRadius
                var radius = calcPropRadius(circleValues[key]);
                // Calculate the cy position based on the radius
                var cy = 59 - radius; // Position circles from the bottom of SVG container
                // Create circle SVG element
                svgCircles += `<circle class="legend-circle" id="${key}" r="${radius}" cy="${cy}" cx="30" fill="#F47821" fill-opacity="0.8" stroke="#000000"/>`;

                // Calculate the y position of text based on the index
                var textY = index * 20 + 20;
                // Create text SVG element
                // Adjusted line for rounding to the nearest whole number
                var valueText = key === 'mean' ? Math.round(circleValues[key]) : circleValues[key]; // Only round for 'mean'
                
                // Create text SVG element with rounded value for 'mean'
                svgTexts += `<text id="${key}-text" x="75" y="${textY}">${valueText}</text>`;            });

            // End the SVG string
            var svgEnd = '</svg>';

            // Append the SVG content to the container
            container.innerHTML += svgStart + svgCircles + svgTexts + svgEnd;

            return container;
        }
    });

    // Remove the old legend if it exists
    var existingLegend = map.getContainer().querySelector('.legend-control-container');
    if (existingLegend) {
        existingLegend.parentNode.removeChild(existingLegend);
    }

    // Add the new legend to the map
    map.addControl(new LegendControl());
}





function updateLegend(map, attribute) {
    // First, remove the existing legend to prevent duplicates
    var existingLegend = map.getContainer().querySelector('.legend-control-container');
    if (existingLegend) {
        existingLegend.remove();
    }

    // Then recreate the legend with the new attribute
    createLegend(map, attribute);
}





document.addEventListener('DOMContentLoaded', createMap);

