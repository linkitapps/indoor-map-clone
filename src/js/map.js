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
    // 2. Three.js 초기화
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.id = 'threejs-canvas';
    document.body.appendChild(renderer.domElement);

    // 3. 3D 구 생성
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        varying vec2 vUv;
        uniform float opacity;
        void main() {
            vec3 color1 = vec3(0.0, 1.0, 1.0); // 상단의 밝은 파란색
            vec3 color2 = vec3(0.0, 0.0, 0.5); // 하단의 어두운 파란색
            float gradient = vUv.y;
            vec3 color = mix(color2, color1, gradient);
            gl_FragColor = vec4(color, opacity);
        }
    `;

    // 쉐이더 재질 생성
    const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        uniforms: {
            opacity: { value: 0.3 } // 투명도 설정 (0.0 ~ 1.0)
        },
        side: THREE.DoubleSide
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // 카메라 위치 설정
    camera.position.set(0, 0, 2);

    // 4. 애니메이션 루프
    function animate() {
        requestAnimationFrame(animate);
        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    animate();

    // 5. 구체 위치 업데이트 함수
    const targetCoordinates = [126.889, 37.5745];
    function updateSpherePosition() {
        const center = map.getCenter();
        const targetPosition = map.project(targetCoordinates);
        const centerPosition = map.project([center.lng, center.lat]);
        
        // 좌표 변환을 통해 위치를 업데이트
        const x = (targetPosition.x - centerPosition.x) / window.innerWidth * 2;
        const y = -(targetPosition.y - centerPosition.y) / window.innerHeight * 2;

        sphere.position.set(x, y, 0);
    }

    // 초기 구체 위치 설정
    updateSpherePosition();

    // 6. 지도 이벤트에 따라 구체 위치 업데이트
    map.on('move', updateSpherePosition);
    map.on('zoom', updateSpherePosition);
    map.on('resize', () => {
        const width = map.getCanvas().clientWidth;
        const height = map.getCanvas().clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        updateSpherePosition();
    });

    // 렌더러 캔버스를 맨 뒤로 보내기
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = 0;
    renderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(renderer.domElement);
    // 구 생성 끝
})






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