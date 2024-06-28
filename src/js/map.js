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

// eslint-disable-next-line no-undef
const tb = (window.tb = new Threebox(
    map,
    map.getCanvas().getContext('webgl'),
    {
        defaultLights: true
    }
));

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

    // 3D 모델 로드
    add3DModel();

    // 3D 구 생성
    add3DSphere();
})

function add3DModel() {
    map.addLayer({
        id: 'custom-threebox-model',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function () {
            // Creative Commons License attribution:  Metlife Building model by https://sketchfab.com/NanoRay
            // https://sketchfab.com/3d-models/metlife-building-32d3a4a1810a4d64abb9547bb661f7f3
            const scale = 0.5;
            const options = {
                obj: 'data/34M_17/34M_17.gltf',
                type: 'gltf',
                scale: { x: scale, y: scale, z: scale },
                units: 'meters',
                rotation: { x: 90, y: -90, z: 0 }
            };

            tb.loadObj(options, (model) => {
                model.setCoords([126.889, 37.5745]);
                model.setRotation({ x: 0, y: 0, z: 241 });
                tb.add(model);
            });
        },

        render: function () {
            tb.update();
        }
    });
}


function add3DSphere() {
    // Create a 3D sphere with radius 30 meters
    const radius = 10; // 10 meters
    const geometry = new THREE.SphereGeometry(radius, 64, 64); // Radius 30 meters, 64 width segments, 64 height segments
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x0000ff, // Blue color
        opacity: 0.5, // Set opacity to 50%
        transparent: true, // Enable transparency
        roughness: 0.5, // Roughness for material
        metalness: 0.1 // Metalness for material
    });
    const sphere = new THREE.Mesh(geometry, material);

    // Add lights to create gradients
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1).normalize();
    tb.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, -1, -1).normalize();
    tb.add(directionalLight2);

    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    tb.add(ambientLight);

    // Set the coordinates for the sphere
    const sphereObject = tb.Object3D({ obj: sphere, units: 'meters' }).setCoords([126.889, 37.5745]);

    // Add the sphere to the scene
    tb.add(sphereObject);

    map.addLayer({
        id: 'custom-threebox-sphere',
        type: 'custom',
        renderingMode: '3d',
        render: function () {
            tb.update();
        }
    });
}








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