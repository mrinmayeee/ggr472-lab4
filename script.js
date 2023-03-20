/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
//Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoibXJpbm1heWVlZSIsImEiOiJjbGRtMHNobWkwMnRhM25teTJ6Y3poYWY3In0.7jz_b3HAoeEVcCmXB3qCKA'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

//Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', //container id in HTML
    style: 'mapbox://styles/mrinmayeee/cldm1cm1x004y01rzd056cygz',  //****ADD MAP STYLE HERE *****
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 9 // starting zoom level
});

//Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

//Add fullscreen option to the map
map.addControl(new mapboxgl.FullscreenControl());

/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
let collisionto;

// Fetch GeoJSON from URL and store response
fetch('https://raw.githubusercontent.com/mrinmayeee/ggr472-lab4/main/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response); //Check response in console
        collisionto = response; // Store geojson as variable using URL from fetch response
    });

map.on('load', () => {

    // map.addSource('collisonscheck', { USED TO VIEW COLLISION DATA, REMOVED LATER
    //     type: 'geojson',
    //     data: collisionto
    //     });

    // map.addLayer(
    //     {
    //         'id': 'collided',
    //         'type': 'circle',
    //         'source': 'collisonscheck',
    //         'paint': { 
    //             'circle-radius': 5,
    //             'circle-color': '#ecec10',
    //             'circle-stroke-width': 2,
    //             'circle-stroke-color': '#0077b6'
    //         }            
    //     });
});

/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data then store as a feature collection variable
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function
map.on('load', () => {

    let bboxgeojson;
    let bbox = turf.envelope(collisionto);

    let bbox1 = turf.transformScale(bbox, 1.1);

    bboxgeojson = {
        "type": "FeatureCollection",
        features: [bbox1]

    };

    let bboxcoords = [bbox1.geometry.coordinates[0][0][0],
    bbox1.geometry.coordinates[0][0][1],
    bbox1.geometry.coordinates[0][2][0],
    bbox1.geometry.coordinates[0][2][1],
    ];

    //console.log(bboxcoords) TO CHECK IF bboxcoords WAS CORRECT

    let hexgridto = turf.hexGrid(bboxcoords, 1, { units: 'kilometers' });



    /*--------------------------------------------------------------------
    Step 4: AGGREGATE COLLISIONS BY HEXGRID
    --------------------------------------------------------------------*/
    //HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
    //      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty

    let collisiontohex = turf.collect(hexgridto, collisionto, '_id', 'values');
    //console.log(collisiontohex)

    let maxcollisions = 0;

    collisiontohex.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length
        if (feature.properties.COUNT > maxcollisions) {
            console.log(feature);
            maxcollisions = feature.properties.COUNT
        }
    })
    //console.log("maximum collisions is" + maxcollisions) to see the max. no. of collisions


    document.getElementById('hexgridbutton').addEventListener('click', () => { //making the hexgrid appear on clicking the Hexgrid button
        map.addSource('hexgrid_to', {
            "type": "geojson",
            "data": hexgridto
        });
        map.addLayer({
            "id": "hexagons",
            "type": "fill",
            "source": "hexgrid_to",
            "paint": {
                'fill-color': [
                    'step',
                    ['get', 'COUNT'],
                    '#D6DBDF',
                    5, '#A569BD',
                    10, '#2980B9',
                    15, '#3498DB',
                    20, '#16A085',
                    25, '#27AE60',
                    30, '#2ECC71',
                    35, '#F1C40F',
                    40, '#F39C12',
                    45, '#E67E22',
                    50, '#D35400',
                    55, '#ad1e14',
                    60, '#681111',
                    65, '#460a06'
                ],
                'fill-opacity': 0.8,
                'fill-outline-color': "black"
            }
        });

        document.getElementById('hexgridbutton').disabled = true;

    });

});

// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows

//POP-UP ON CLICK EVENT
map.on('mouseenter', 'hexagons', () => {
    map.getCanvas().style.cursor = 'pointer'; //Switch cursor to pointer when mouse is over a green place marker
});

map.on('mouseleave', 'hexagons', () => {
    map.getCanvas().style.cursor = ''; //Switch cursor back when mouse leaves the green place marker
});

map.on('click', 'hexagons', (e) => {
    new mapboxgl.Popup() //Create a new popup box on each click
        .setLngLat(e.lngLat) //Use method to set the coordinates of popup based on where the user clicks
        .setHTML("<b>Number of collisions:</b> " + e.features[0].properties.COUNT)
        .addTo(map); //Show popup on map
});

//Add event listener which returns map view to full screen on button click
document.getElementById('returnbutton').addEventListener('click', () => {
    map.flyTo({
        center: [-79.39, 43.65],
        zoom: 9,
        essential: true
    });
});

//Adding a search box - create geocoder variable
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    countries: "ca"
});

//Use geocoder div to position geocoder on page
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));