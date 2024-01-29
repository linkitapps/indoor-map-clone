const map = (window.map = new maplibregl.Map({
    container: 'map',
    style:
    {
        'id': 'raster',
        'version': 8,
        'name': 'Raster tiles',
        'center': [0, 0],
        'zoom': 0,
        'sources': {
            'raster-tiles': {
                'type': 'raster',
                'tiles': ['https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png'],
                'tileSize': 256,
                'minzoom': 0,
                'maxzoom': 19
            }
        },
        'layers': [
            {
                'id': 'background',
                'type': 'background',
                'paint': {
                    'background-color': '#e0dfdf'
                }
            },
            {
                'id': 'simple-tiles',
                'type': 'raster',
                'source': 'raster-tiles'
            }
        ]
    },
    zoom: 19,
    center: [126.88892, 37.57460],
    pitch: 60,
    maxPitch: 85,
    bearing: 0,
    antialias: true
}));

const navControl = new maplibregl.NavigationControl({
    visualizePitch: true,
    showZoom: false,
    showCompass: true,
});

map.addControl(navControl, 'top-left')

map.on('load', () => {
    map.loadImage('./src/ext/door.png', function(error, image) {
        if (error) throw error;
        // Add the loaded image to the style's sprite with the ID 'kitten'.
        map.addImage('room', image);
    });
    map.addSource('im', {
        type: 'geojson',
        data: './src/ext/building.geojson',
        generateId: true
    });

    
    map.addLayer({
        id: 'room-extrusion',
        type: 'fill-extrusion',
        source: 'im',
        layout: {
            visibility: 'visible',
        },
        paint: {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'base_height'],
            'fill-extrusion-opacity': 0.7
        },
        filter: ['==', ['get', 'level'], 1]
    });

    map.addLayer({
        id: 'room-extrusion2',
        type: 'fill-extrusion',
        source: 'im',
        layout: {
            visibility: 'visible',
        },
        paint: {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'base_height'],
            'fill-extrusion-opacity': 0.7
        },
        filter: ['==', ['get', 'level'], 2]
    });
})

const popup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: false
});

map.on('click', 'room-extrusion', (e) => {
    map.getCanvas().style.cursor = 'pointer';

    // console.log(e.features[0].properties)

    popup.setLngLat(e.lngLat).setHTML(`명칭: ${e.features[0].properties.name}<br>
    넓이: ${e.features[0].properties.area_sqm}㎡<br>
    <img class='photo-test' src='${e.features[0].properties.photo}'/>`).addTo(map)

})

map.on('click', 'room-extrusion2', (e) => {
    map.getCanvas().style.cursor = 'pointer';

    popup.setLngLat(e.lngLat).setHTML(`명칭: ${e.features[0].properties.name}<br>
    넓이: ${e.features[0].properties.area_sqm}㎡<br>
    <img class='photo-test' src='${e.features[0].properties.photo}'/>`).addTo(map)
    

})






// 71.428572161323359, 51.091671321981359
// 126.88892, 37.57460
// geojson.features.forEach(function(item) {
//     if (typeof(item.geometry.coordinates[0]) === 'number') {
//         item.geometry.coordinates = [item.geometry.coordinates[0] + 55.46034783867664, item.geometry.coordinates[1] -13.517071321981362];
//     } else {
//         item.geometry.coordinates.forEach(function(item2, i) {
//             item2.forEach(function(item3, j) {
//                 item3.forEach(function(item4, k) {
//                     item.geometry.coordinates[i][j][k] = [item4[0] + 55.46034783867664, item4[1] -13.517071321981362];
//                 });
//             });
//         });
//     }
// });