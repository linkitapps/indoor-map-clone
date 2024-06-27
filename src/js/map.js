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

    // 구 생성 시작
    // 구 좌표 생성 함수
    function createSphere(center, radius, segments) {
        const [centerLng, centerLat] = center;
        const vertices = [];

        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI; // 0에서 PI까지
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let j = 0; j <= segments; j++) {
                const phi = (j / segments) * 2 * Math.PI; // 0에서 2PI까지
                const x = radius * cosTheta * Math.cos(phi);
                const y = radius * cosTheta * Math.sin(phi);
                const z = radius * sinTheta;

                vertices.push({
                    position: [centerLng + x / 100000, centerLat + y / 100000],
                    radius: 100, // 각 원기둥의 반경
                    height: z * 1000 // 각 원기둥의 높이
                });
            }
        }

        return vertices;
    }

    // 구 데이터 생성
    
    // 구 생성 끝
})

// 창 크기 조정 시 WebGL 컨텍스트와 렌더러 크기 조정
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    gl.canvas.width = width;
    gl.canvas.height = height;
});







// 3D model 로드 시작
// parameters to ensure the model is georeferenced correctly on the map
const modelOrigin = [126.889, 37.5745];
const modelAltitude = 0;
const modelRotate = [Math.PI / 2, 0, 0];

const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
    modelOrigin,
    modelAltitude
);

// transformation parameters to position, rotate and scale the 3D model onto the map
const modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    /* Since our 3D model is in real world meters, a scale transform needs to be
    * applied since the CustomLayerInterface expects units in MercatorCoordinates.
    */
    // scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
    scale: 6e-9
};

const THREE = window.THREE;

// configuration of the custom layer for a 3D model per the CustomLayerInterface
const customLayer = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',
    onAdd (map, gl) {
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        // create two three.js lights to illuminate the model
        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff);
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight2);

        // use the three.js GLTF loader to add the 3D model to the three.js scene
        const loader = new THREE.GLTFLoader();
        loader.load(
            'data/34M_17/34M_17.gltf',
            (gltf) => {
                this.scene.add(gltf.scene);
            }
        );
        this.map = map;

        // use the MapLibre GL JS map canvas for three.js
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
        });

        this.renderer.autoClear = false;
    },
    render (gl, matrix) {
        const rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0),
            modelTransform.rotateX
        );
        const rotationY = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 1, 0),
            modelTransform.rotateY
        );
        const rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1),
            modelTransform.rotateZ
        );

        const m = new THREE.Matrix4().fromArray(matrix);
        const l = new THREE.Matrix4()
            .makeTranslation(
                modelTransform.translateX,
                modelTransform.translateY,
                modelTransform.translateZ
            )
            .scale(
                new THREE.Vector3(
                    modelTransform.scale,
                    -modelTransform.scale,
                    modelTransform.scale
                )
            )
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
    }
};

map.on('style.load', () => {
    map.addLayer(customLayer);
});
// 3D model 로드 끝









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