/* ═══════════════════════════════════════════
   MAIN — 3D Adventure World Engine
   Three.js · Drivable Cars · Exploration
   ═══════════════════════════════════════════ */

const App = {
    scene: null, camera: null, renderer: null,
    clock: null,
    keys: {},
    player: null,         // 3D character group
    playerPos: new THREE.Vector3(0, 0, 0),
    playerDir: 0,         // facing angle
    playerVel: 0,
    playerSpeed: 0.18,
    isWalking: false,
    walkFrame: 0,

    // Driving
    driving: false,
    activeCar: null,
    carSpeed: 0,
    carSteer: 0,
    cars: [],

    // World objects
    trees: [],
    signs: [],
    house: null,
    vendingMachine: null,
    petals: null,
    ground: null,
    road: null,
    sunLight: null,
    ambientLight: null,
    hemiLight: null,

    // State
    coins: 0,
    dayNight: { time: 0, cycleLen: 90, isNight: false },
    homeNotifShown: false,
    started: false,

    funFacts: {
        list: [
            "I can solve a Rubik's cube in under 2 minutes!",
            "My favorite programming language is JavaScript.",
            "I want to study Biomedical Engineering in college.",
            "I've been coding since I was 14 years old.",
            "My favorite game of all time is Minecraft.",
            "I dream of creating my own game studio one day.",
            "I love watching anime in my free time.",
            "Medicine + Engineering + CS = my perfect career combo.",
            "I built this entire portfolio by myself!",
            "My school banned game websites... so I made my own 😎",
            "I'm working on a Roblox game releasing May 2026.",
            "Cherry blossoms are my favorite trees 🌸",
            "I'm from Avon, Indiana — Go Orioles!",
            "I love a good jazz playlist while I code.",
            "Fun fact: this site has 14 hidden achievements!",
        ],
        current: 0, lastChange: 0, interval: 90000,
    },

    start() {
        if (this.started) return;
        this.started = true;

        try { this.coins = parseInt(localStorage.getItem('mayowa_coins')) || 0; } catch(e) {}
        this.updateCoinDisplay();

        this.clock = new THREE.Clock();
        this.initRenderer();
        this.initScene();
        this.initLighting();
        this.initGround();
        this.initRoad();
        this.initTrees();
        this.initHouse();
        this.initVendingMachine();
        this.initSigns();
        this.initCars();
        this.initPlayer();
        this.initPetals();
        this.initInput();
        this.initUI();

        Achievements.init();
        this.drawAboutChar();
        this.showFunFact();
        this.trackVisitor();

        setTimeout(() => {
            document.getElementById('homeNotif').classList.remove('hidden');
            setTimeout(() => document.getElementById('homeNotif').classList.add('hidden'), 8000);
        }, 3000);

        this.animate();
    },

    /* ═══════════ RENDERER & SCENE ═══════════ */

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        document.body.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.inset = '0';
        this.renderer.domElement.style.zIndex = '1';

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    },

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 80, 250);
        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
        this.camera.position.set(0, 8, 15);
    },

    initLighting() {
        this.hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x556B2F, 0.6);
        this.scene.add(this.hemiLight);

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xFFE4B5, 1.2);
        this.sunLight.position.set(50, 80, 30);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.set(1024, 1024);
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 200;
        this.sunLight.shadow.camera.left = -60;
        this.sunLight.shadow.camera.right = 60;
        this.sunLight.shadow.camera.top = 60;
        this.sunLight.shadow.camera.bottom = -60;
        this.scene.add(this.sunLight);
    },

    /* ═══════════ GROUND & ROAD ═══════════ */

    initGround() {
        const geo = new THREE.PlaneGeometry(300, 300, 1, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.9 });
        this.ground = new THREE.Mesh(geo, mat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    },

    initRoad() {
        // Main road
        const roadGeo = new THREE.PlaneGeometry(10, 250, 1, 1);
        const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.95 });
        this.road = new THREE.Mesh(roadGeo, roadMat);
        this.road.rotation.x = -Math.PI / 2;
        this.road.position.set(0, 0.01, 0);
        this.road.receiveShadow = true;
        this.scene.add(this.road);

        // Road lines
        for (let z = -120; z < 120; z += 8) {
            const lineGeo = new THREE.PlaneGeometry(0.3, 3, 1, 1);
            const lineMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.02, z);
            this.scene.add(line);
        }

        // Cross road
        const crossGeo = new THREE.PlaneGeometry(250, 8, 1, 1);
        const cross = new THREE.Mesh(crossGeo, roadMat.clone());
        cross.rotation.x = -Math.PI / 2;
        cross.position.set(0, 0.01, 30);
        cross.receiveShadow = true;
        this.scene.add(cross);

        // Sidewalks
        const swMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.85 });
        [[-6, 0], [6, 0], [0, 35], [0, 25]].forEach(([x, z], i) => {
            const isH = i >= 2;
            const g = new THREE.PlaneGeometry(isH ? 250 : 2, isH ? 2 : 250);
            const m = new THREE.Mesh(g, swMat);
            m.rotation.x = -Math.PI / 2;
            m.position.set(x, 0.015, z);
            this.scene.add(m);
        });
    },

    /* ═══════════ TREES ═══════════ */

    initTrees() {
        const treePositions = [
            [-15, -20], [-20, -50], [-25, -80], [-12, 10], [-18, 45],
            [-22, 70], [-15, 95], [15, -30], [20, -60], [18, -90],
            [12, 15], [22, 50], [25, 80], [16, 100], [-30, 0],
            [30, -40], [-35, -65], [35, 60], [-28, 40], [28, -10],
            [-40, -30], [40, 20], [-38, 55], [38, -55],
        ];

        treePositions.forEach(([x, z]) => {
            const tree = this.createTree();
            tree.position.set(x + (Math.random()-0.5)*3, 0, z + (Math.random()-0.5)*3);
            tree.scale.setScalar(0.8 + Math.random() * 0.6);
            this.scene.add(tree);
            this.trees.push(tree);
        });
    },

    createTree() {
        const group = new THREE.Group();

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 5, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 2.5;
        trunk.castShadow = true;
        group.add(trunk);

        // Cherry blossom canopy — multiple pink spheres
        const pinkHue = 0xFFB6C1;
        const hues = [0xFFB6C1, 0xFFC0CB, 0xFFAFBB, 0xFF91A4, 0xFFA6C9];
        for (let i = 0; i < 7; i++) {
            const r = 1.5 + Math.random() * 1.5;
            const canopyGeo = new THREE.SphereGeometry(r, 12, 12);
            const canopyMat = new THREE.MeshStandardMaterial({
                color: hues[i % hues.length],
                roughness: 0.8,
                transparent: true,
                opacity: 0.85,
            });
            const canopy = new THREE.Mesh(canopyGeo, canopyMat);
            canopy.position.set(
                (Math.random() - 0.5) * 3,
                5 + Math.random() * 2.5,
                (Math.random() - 0.5) * 3
            );
            canopy.castShadow = true;
            group.add(canopy);
        }

        group.userData.swayOffset = Math.random() * Math.PI * 2;
        return group;
    },

    /* ═══════════ HOUSE ═══════════ */

    initHouse() {
        const house = new THREE.Group();

        // Walls
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.8 });
        const wallGeo = new THREE.BoxGeometry(12, 7, 10);
        const walls = new THREE.Mesh(wallGeo, wallMat);
        walls.position.y = 3.5;
        walls.castShadow = true; walls.receiveShadow = true;
        house.add(walls);

        // Roof
        const roofGeo = new THREE.ConeGeometry(9, 4, 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 9;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        house.add(roof);

        // Door
        const doorGeo = new THREE.BoxGeometry(2, 3.5, 0.3);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, 1.75, 5.1);
        house.add(door);

        // Doorknob
        const knobGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const knobMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8 });
        const knob = new THREE.Mesh(knobGeo, knobMat);
        knob.position.set(0.6, 1.8, 5.25);
        house.add(knob);

        // Windows (emissive at night)
        const winMat = new THREE.MeshStandardMaterial({
            color: 0x87CEEB, roughness: 0.3,
            emissive: 0xFFE4B5, emissiveIntensity: 0,
        });
        [[-3.5, 4, 5.05], [3.5, 4, 5.05], [-3.5, 4, -5.05], [3.5, 4, -5.05]].forEach(([x, y, z]) => {
            const winGeo = new THREE.BoxGeometry(2, 2, 0.2);
            const win = new THREE.Mesh(winGeo, winMat.clone());
            win.position.set(x, y, z);
            house.add(win);
        });

        // Chimney
        const chimGeo = new THREE.BoxGeometry(1.5, 3, 1.5);
        const chimMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41 });
        const chim = new THREE.Mesh(chimGeo, chimMat);
        chim.position.set(3, 10, -2);
        house.add(chim);

        house.position.set(35, 0, -20);
        house.userData.type = 'house';
        this.house = house;
        this.scene.add(house);
    },

    /* ═══════════ VENDING MACHINE ═══════════ */

    initVendingMachine() {
        const vm = new THREE.Group();

        // Body
        const bodyGeo = new THREE.BoxGeometry(2, 4, 1.5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xB71C1C, roughness: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 2; body.castShadow = true;
        vm.add(body);

        // Glass panel
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0xBBDEFB, roughness: 0.1, transparent: true, opacity: 0.5,
        });
        const glass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2, 0.1), glassMat);
        glass.position.set(0, 2.5, 0.75);
        vm.add(glass);

        // Slot
        const slotGeo = new THREE.BoxGeometry(1.4, 0.5, 0.1);
        const slotMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const slot = new THREE.Mesh(slotGeo, slotMat);
        slot.position.set(0, 0.5, 0.76);
        vm.add(slot);

        // Coin slot glow
        const coinGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const coinMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.5 });
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.position.set(0.8, 2.8, 0.76);
        vm.add(coin);

        vm.position.set(-20, 0, 50);
        vm.userData.type = 'vending';
        this.vendingMachine = vm;
        this.scene.add(vm);
    },

    /* ═══════════ SIGNS ═══════════ */

    initSigns() {
        const signData = [
            { x: -8, z: -10, label: '📜 ABOUT ME', action: 'about' },
            { x: -8, z: 15, label: '🎮 GAMES', action: 'games' },
        ];

        signData.forEach(s => {
            const group = new THREE.Group();

            // Post
            const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 4, 8);
            const postMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.y = 2; post.castShadow = true;
            group.add(post);

            // Board
            const boardGeo = new THREE.BoxGeometry(4, 1.5, 0.3);
            const boardMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41 });
            const board = new THREE.Mesh(boardGeo, boardMat);
            board.position.y = 3.5; board.castShadow = true;
            group.add(board);

            // Text sprite
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#6D4C41'; ctx.fillRect(0, 0, 512, 128);
            ctx.fillStyle = '#FFD54F';
            ctx.font = 'bold 40px "Press Start 2P", monospace';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(s.label, 256, 64);

            const tex = new THREE.CanvasTexture(canvas);
            const spriteMat = new THREE.SpriteMaterial({ map: tex });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(4, 1, 1);
            sprite.position.y = 3.5;
            group.add(sprite);

            group.position.set(s.x, 0, s.z);
            group.userData = { type: 'sign', action: s.action };
            this.signs.push(group);
            this.scene.add(group);
        });
    },

    /* ═══════════ CARS ═══════════ */

    initCars() {
        const carConfigs = [
            { x: 3, z: -25, rot: 0, color: 0xFF5252, name: 'Red Racer' },
            { x: -3, z: 0, rot: Math.PI, color: 0x2196F3, name: 'Blue Cruiser' },
            { x: 3, z: 40, rot: 0, color: 0xFFEB3B, name: 'Yellow Taxi' },
            { x: 50, z: 30, rot: Math.PI / 2, color: 0x4CAF50, name: 'Green Machine' },
        ];

        carConfigs.forEach(conf => {
            const car = this.createCar(conf.color);
            car.position.set(conf.x, 0, conf.z);
            car.rotation.y = conf.rot;
            car.userData = { type: 'car', name: conf.name, vel: 0, steer: 0 };
            this.cars.push(car);
            this.scene.add(car);
        });
    },

    createCar(color) {
        const car = new THREE.Group();

        // Body
        const bodyGeo = new THREE.BoxGeometry(2.5, 1, 5);
        const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.8; body.castShadow = true;
        car.add(body);

        // Cabin
        const cabGeo = new THREE.BoxGeometry(2.2, 0.9, 2.5);
        const cabMat = new THREE.MeshStandardMaterial({
            color: 0x333333, roughness: 0.2, metalness: 0.1,
        });
        const cab = new THREE.Mesh(cabGeo, cabMat);
        cab.position.set(0, 1.7, -0.3); cab.castShadow = true;
        car.add(cab);

        // Windows
        const winMat = new THREE.MeshStandardMaterial({
            color: 0x87CEEB, transparent: true, opacity: 0.6, roughness: 0.1,
        });
        const winGeo = new THREE.BoxGeometry(2.25, 0.7, 0.05);
        [1.25, -1.55].forEach(z => {
            const w = new THREE.Mesh(winGeo, winMat);
            w.position.set(0, 1.7, z);
            car.add(w);
        });

        // Side windows
        const sideGeo = new THREE.BoxGeometry(0.05, 0.7, 2.3);
        [-1.13, 1.13].forEach(x => {
            const sw = new THREE.Mesh(sideGeo, winMat);
            sw.position.set(x, 1.7, -0.3);
            car.add(sw);
        });

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        [[-1.1, 0.4, 1.6], [1.1, 0.4, 1.6], [-1.1, 0.4, -1.6], [1.1, 0.4, -1.6]].forEach(([x, y, z]) => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(x, y, z);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            car.add(wheel);
        });

        // Headlights
        const hlMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFFF88, emissiveIntensity: 0.5 });
        const hlGeo = new THREE.SphereGeometry(0.15, 8, 8);
        [[-0.8, 0.9, 2.55], [0.8, 0.9, 2.55]].forEach(([x, y, z]) => {
            const hl = new THREE.Mesh(hlGeo, hlMat);
            hl.position.set(x, y, z);
            car.add(hl);
        });

        // Taillights
        const tlMat = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.3 });
        [[-0.8, 0.9, -2.55], [0.8, 0.9, -2.55]].forEach(([x, y, z]) => {
            const tl = new THREE.Mesh(hlGeo.clone(), tlMat);
            tl.position.set(x, y, z);
            car.add(tl);
        });

        return car;
    },

    /* ═══════════ PLAYER CHARACTER ═══════════ */

    initPlayer() {
        this.player = new THREE.Group();
        const S = 0.35; // scale

        // Head
        const headGeo = new THREE.BoxGeometry(1.2*S, 1.2*S, 1.2*S);
        const skinMat = new THREE.MeshStandardMaterial({ color: 0x8D6E4C, roughness: 0.8 });
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 3.8 * S;
        head.castShadow = true;
        this.player.add(head);

        // Hair
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const hair = new THREE.Mesh(new THREE.BoxGeometry(1.3*S, 0.5*S, 1.3*S), hairMat);
        hair.position.y = 4.2 * S;
        this.player.add(hair);

        // Red accessory
        const accMat = new THREE.MeshStandardMaterial({ color: 0xE53935 });
        const acc = new THREE.Mesh(new THREE.BoxGeometry(0.3*S, 0.3*S, 0.3*S), accMat);
        acc.position.set(-0.5*S, 4.1*S, 0.3*S);
        this.player.add(acc);

        // Eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        [[-0.2*S, 3.85*S, 0.6*S], [0.2*S, 3.85*S, 0.6*S]].forEach(([x, y, z]) => {
            const eye = new THREE.Mesh(new THREE.BoxGeometry(0.15*S, 0.15*S, 0.1*S), eyeMat);
            eye.position.set(x, y, z);
            this.player.add(eye);
        });

        // Body (orange top)
        const topMat = new THREE.MeshStandardMaterial({ color: 0xFF9800 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(1*S, 1.3*S, 0.6*S), topMat);
        body.position.y = 2.7 * S;
        body.castShadow = true;
        this.player.add(body);

        // Arms
        this.player.userData = { leftArm: null, rightArm: null, leftLeg: null, rightLeg: null };
        const armGeo = new THREE.BoxGeometry(0.3*S, 1.1*S, 0.3*S);
        const leftArm = new THREE.Mesh(armGeo, skinMat.clone());
        leftArm.position.set(-0.65*S, 2.5*S, 0);
        this.player.add(leftArm);
        this.player.userData.leftArm = leftArm;

        const rightArm = new THREE.Mesh(armGeo, skinMat.clone());
        rightArm.position.set(0.65*S, 2.5*S, 0);
        this.player.add(rightArm);
        this.player.userData.rightArm = rightArm;

        // Shorts (white/gray)
        const shortsMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC });
        const shorts = new THREE.Mesh(new THREE.BoxGeometry(0.9*S, 0.6*S, 0.55*S), shortsMat);
        shorts.position.y = 1.8 * S;
        this.player.add(shorts);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.35*S, 1*S, 0.35*S);
        const leftLeg = new THREE.Mesh(legGeo, skinMat.clone());
        leftLeg.position.set(-0.2*S, 1*S, 0);
        this.player.add(leftLeg);
        this.player.userData.leftLeg = leftLeg;

        const rightLeg = new THREE.Mesh(legGeo, skinMat.clone());
        rightLeg.position.set(0.2*S, 1*S, 0);
        this.player.add(rightLeg);
        this.player.userData.rightLeg = rightLeg;

        // Shoes (dark with pink sole)
        const shoeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        [[-0.2*S, 0.35*S, 0], [0.2*S, 0.35*S, 0]].forEach(([x, y, z]) => {
            const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.4*S, 0.3*S, 0.5*S), shoeMat);
            shoe.position.set(x, y, z);
            this.player.add(shoe);
        });

        // Name sprite
        const nameCanvas = document.createElement('canvas');
        nameCanvas.width = 256; nameCanvas.height = 64;
        const nctx = nameCanvas.getContext('2d');
        nctx.font = 'bold 32px "Press Start 2P", monospace';
        nctx.textAlign = 'center';
        nctx.fillStyle = '#fff';
        nctx.fillText('Mayowa', 128, 40);
        const nameTex = new THREE.CanvasTexture(nameCanvas);
        const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex, transparent: true }));
        nameSprite.scale.set(2, 0.5, 1);
        nameSprite.position.y = 2;
        this.player.add(nameSprite);

        this.player.position.set(0, 0, 0);
        this.scene.add(this.player);
    },

    /* ═══════════ CHERRY BLOSSOM PETALS ═══════════ */

    initPetals() {
        const count = 500;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 1] = Math.random() * 30;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
            velocities.push({
                vy: -0.02 - Math.random() * 0.03,
                vx: (Math.random() - 0.5) * 0.02,
                vz: (Math.random() - 0.5) * 0.02,
            });
        }

        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xFFB6C1, size: 0.3, transparent: true, opacity: 0.7,
        });

        this.petals = new THREE.Points(geo, mat);
        this.petals.userData.velocities = velocities;
        this.scene.add(this.petals);
    },

    /* ═══════════ INPUT ═══════════ */

    initInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
            if (e.code === 'KeyE') this.handleInteract();
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);

        this.renderer.domElement.addEventListener('click', (e) => this.handleWorldClick(e));
    },

    initUI() {
        document.getElementById('musicToggle').addEventListener('click', () => this.toggleMusic());
        document.getElementById('achievementsBtn').addEventListener('click', () => this.openModal('achievementsModal'));
        document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => this.closeModal(btn.dataset.close)));
        document.querySelectorAll('.game-card').forEach(card => card.addEventListener('click', () => { this.closeModal('gamesModal'); this.launchGame(card.dataset.game); }));
        document.getElementById('backToPortfolio').addEventListener('click', () => this.closeGame());
        document.getElementById('backToGames').addEventListener('click', () => { this.closeGame(); setTimeout(() => this.openModal('gamesModal'), 100); });
        document.querySelectorAll('.drink-card').forEach(card => card.addEventListener('click', () => this.buyDrink(card.dataset.drink)));
        document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) this.closeModal(m.id); }));
        this.setupContactForm();
    },

    /* ═══════════ MAIN LOOP ═══════════ */

    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = Math.min(this.clock.getDelta(), 0.05);
        const t = this.clock.getElapsedTime();

        this.updateDayNight(t);
        if (this.driving) this.updateDriving(dt, t);
        else this.updatePlayer(dt, t);
        this.updateCamera(dt);
        this.updatePetals();
        this.updateTreeSway(t);
        this.updateInteractPrompt();
        this.updateFunFacts();

        this.renderer.render(this.scene, this.camera);
    },

    /* ═══════════ DAY/NIGHT ═══════════ */

    updateDayNight(t) {
        const cycle = this.dayNight.cycleLen;
        const phase = (t % (cycle * 2)) / (cycle * 2);
        this.dayNight.time = phase;
        const wasNight = this.dayNight.isNight;
        this.dayNight.isNight = phase > 0.5;
        if (!wasNight && this.dayNight.isNight) Achievements.unlock('night_owl');

        // Night factor 0-1
        const nf = phase < 0.4 ? 0 : phase < 0.5 ? (phase - 0.4) / 0.1 : phase < 0.9 ? 1 : 1 - (phase - 0.9) / 0.1;

        // Sky color
        const dayColor = new THREE.Color(0x87CEEB);
        const nightColor = new THREE.Color(0x0a0a2e);
        this.scene.background = dayColor.clone().lerp(nightColor, nf);
        this.scene.fog.color.copy(this.scene.background);

        // Lighting
        this.sunLight.intensity = 1.2 - nf * 0.9;
        this.sunLight.color.setHex(nf > 0.5 ? 0x4466AA : 0xFFE4B5);
        this.ambientLight.intensity = 0.3 - nf * 0.15;
        this.hemiLight.intensity = 0.6 - nf * 0.35;

        // Window glow on house at night
        if (this.house) {
            this.house.children.forEach(c => {
                if (c.material && c.material.emissive && c.material.emissiveIntensity !== undefined) {
                    if (c.material.color.getHex() === 0x87CEEB) {
                        c.material.emissiveIntensity = nf * 0.8;
                    }
                }
            });
        }

        const display = document.getElementById('timeDisplay');
        if (display) {
            if (this.dayNight.isNight) { display.textContent = '🌙 Night'; display.style.color = '#BB86FC'; }
            else { display.textContent = '☀️ Day'; display.style.color = '#FFD54F'; }
        }
    },

    /* ═══════════ PLAYER MOVEMENT ═══════════ */

    updatePlayer(dt, t) {
        const speed = this.playerSpeed;
        let moving = false;
        const dir = new THREE.Vector3();

        // Camera-relative movement
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        camDir.y = 0; camDir.normalize();
        const camRight = new THREE.Vector3(-camDir.z, 0, camDir.x);

        if (this.keys.KeyW || this.keys.ArrowUp) { dir.add(camDir); moving = true; }
        if (this.keys.KeyS || this.keys.ArrowDown) { dir.sub(camDir); moving = true; }
        if (this.keys.KeyA || this.keys.ArrowLeft) { dir.sub(camRight); moving = true; }
        if (this.keys.KeyD || this.keys.ArrowRight) { dir.add(camRight); moving = true; }

        if (moving && dir.length() > 0) {
            dir.normalize();
            this.playerPos.add(dir.multiplyScalar(speed));
            this.playerDir = Math.atan2(dir.x, dir.z);
            this.walkFrame += 0.15;
            Achievements.addWalk(speed * 10);
        }

        // Clamp to world bounds
        this.playerPos.x = Math.max(-140, Math.min(140, this.playerPos.x));
        this.playerPos.z = Math.max(-140, Math.min(140, this.playerPos.z));

        this.player.position.copy(this.playerPos);
        this.player.rotation.y = this.playerDir;

        // Walk animation
        this.isWalking = moving;
        const ud = this.player.userData;
        if (moving) {
            const swing = Math.sin(this.walkFrame * 4) * 0.5;
            if (ud.leftArm) ud.leftArm.rotation.x = swing;
            if (ud.rightArm) ud.rightArm.rotation.x = -swing;
            if (ud.leftLeg) ud.leftLeg.rotation.x = -swing * 0.7;
            if (ud.rightLeg) ud.rightLeg.rotation.x = swing * 0.7;
        } else {
            // Breathing idle
            const breathe = Math.sin(t * 2) * 0.03;
            this.player.position.y = breathe;
            if (ud.leftArm) ud.leftArm.rotation.x *= 0.9;
            if (ud.rightArm) ud.rightArm.rotation.x *= 0.9;
            if (ud.leftLeg) ud.leftLeg.rotation.x *= 0.9;
            if (ud.rightLeg) ud.rightLeg.rotation.x *= 0.9;
        }

        this.player.visible = true;
    },

    /* ═══════════ DRIVING ═══════════ */

    updateDriving(dt, t) {
        const car = this.activeCar;
        if (!car) return;

        const accel = 0.08;
        const maxSpeed = 0.8;
        const turnRate = 0.03;
        const friction = 0.97;

        if (this.keys.KeyW || this.keys.ArrowUp) car.userData.vel = Math.min(maxSpeed, car.userData.vel + accel);
        else if (this.keys.KeyS || this.keys.ArrowDown) car.userData.vel = Math.max(-maxSpeed * 0.4, car.userData.vel - accel);
        else car.userData.vel *= friction;

        if (Math.abs(car.userData.vel) > 0.01) {
            if (this.keys.KeyA || this.keys.ArrowLeft) car.rotation.y += turnRate * Math.sign(car.userData.vel);
            if (this.keys.KeyD || this.keys.ArrowRight) car.rotation.y -= turnRate * Math.sign(car.userData.vel);
        }

        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y);
        car.position.add(forward.multiplyScalar(car.userData.vel));

        // Clamp
        car.position.x = Math.max(-140, Math.min(140, car.position.x));
        car.position.z = Math.max(-140, Math.min(140, car.position.z));

        // Wheel spin
        car.children.forEach(c => {
            if (c.geometry && c.geometry.type === 'CylinderGeometry' && c.position.y < 0.5) {
                c.rotation.x += car.userData.vel * 2;
            }
        });

        // Update speed display
        const mph = Math.abs(Math.round(car.userData.vel * 100));
        document.getElementById('speedDisplay').textContent = mph;

        this.player.position.copy(car.position);
        this.player.visible = false;
    },

    /* ═══════════ CAMERA ═══════════ */

    updateCamera(dt) {
        const target = this.driving ? this.activeCar.position : this.playerPos;
        const angle = this.driving ? this.activeCar.rotation.y : this.playerDir;

        const idealOffset = new THREE.Vector3(0, 6, -12);
        if (this.driving) idealOffset.set(0, 8, -18);
        idealOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        idealOffset.add(target);

        this.camera.position.lerp(idealOffset, 0.06);

        const lookTarget = target.clone().add(new THREE.Vector3(0, 2, 0));
        this.camera.lookAt(lookTarget);
    },

    /* ═══════════ PETALS & TREE SWAY ═══════════ */

    updatePetals() {
        if (!this.petals) return;
        const pos = this.petals.geometry.attributes.position;
        const vels = this.petals.userData.velocities;
        const t = performance.now() / 1000;

        for (let i = 0; i < vels.length; i++) {
            pos.array[i * 3] += vels[i].vx + Math.sin(t + i) * 0.005;
            pos.array[i * 3 + 1] += vels[i].vy;
            pos.array[i * 3 + 2] += vels[i].vz;
            if (pos.array[i * 3 + 1] < 0) {
                pos.array[i * 3 + 1] = 25 + Math.random() * 10;
                pos.array[i * 3] = this.playerPos.x + (Math.random() - 0.5) * 80;
                pos.array[i * 3 + 2] = this.playerPos.z + (Math.random() - 0.5) * 80;
            }
        }
        pos.needsUpdate = true;
    },

    updateTreeSway(t) {
        this.trees.forEach(tree => {
            const s = tree.userData.swayOffset;
            tree.rotation.z = Math.sin(t * 0.5 + s) * 0.02;
            tree.rotation.x = Math.cos(t * 0.3 + s) * 0.01;
        });
    },

    /* ═══════════ INTERACTIONS ═══════════ */

    updateInteractPrompt() {
        const prompt = document.getElementById('interactPrompt');
        const driveHud = document.getElementById('driveHud');

        if (this.driving) {
            prompt.classList.add('hidden');
            driveHud.classList.remove('hidden');
            return;
        }
        driveHud.classList.add('hidden');

        const pos = this.playerPos;
        let text = '';

        // Check cars
        for (const car of this.cars) {
            if (pos.distanceTo(car.position) < 5) {
                text = `Press E to drive ${car.userData.name} 🚗`;
                break;
            }
        }

        // Check house
        if (this.house && pos.distanceTo(this.house.position) < 10) {
            text = 'Press E to enter house 🏠';
        }

        // Check vending machine
        if (this.vendingMachine && pos.distanceTo(this.vendingMachine.position) < 5) {
            text = 'Press E to buy drinks 🥤';
        }

        // Check signs
        for (const sign of this.signs) {
            if (pos.distanceTo(sign.position) < 4) {
                text = `Press E — ${sign.userData.action === 'about' ? '📜 About Me' : '🎮 Games'}`;
                break;
            }
        }

        if (text) {
            prompt.textContent = text;
            prompt.classList.remove('hidden');
        } else {
            prompt.classList.add('hidden');
        }
    },

    handleInteract() {
        const pos = this.driving ? this.activeCar.position : this.playerPos;

        // Exit car
        if (this.driving) {
            this.driving = false;
            this.activeCar.userData.vel = 0;
            this.playerPos.copy(this.activeCar.position).add(new THREE.Vector3(3, 0, 0));
            this.player.visible = true;
            this.activeCar = null;
            return;
        }

        // Enter car
        for (const car of this.cars) {
            if (pos.distanceTo(car.position) < 5) {
                this.driving = true;
                this.activeCar = car;
                car.userData.vel = 0;
                this.player.visible = false;
                AudioManager.playSfx('click');
                return;
            }
        }

        // House
        if (this.house && pos.distanceTo(this.house.position) < 10) {
            AudioManager.playSfx('click');
            this.openModal('roomModal');
            this.drawRoom();
            return;
        }

        // Vending machine
        if (this.vendingMachine && pos.distanceTo(this.vendingMachine.position) < 5) {
            AudioManager.playSfx('click');
            document.getElementById('vendingStatus').textContent = '';
            this.openModal('vendingModal');
            return;
        }

        // Signs
        for (const sign of this.signs) {
            if (pos.distanceTo(sign.position) < 4) {
                AudioManager.playSfx('click');
                if (sign.userData.action === 'about') { this.openModal('aboutModal'); Achievements.visitSection('about'); }
                else { this.openModal('gamesModal'); Achievements.visitSection('games'); }
                return;
            }
        }
    },

    handleWorldClick(e) {
        // Click on character for speech
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const hits = raycaster.intersectObject(this.player, true);
        if (hits.length > 0) {
            Achievements.unlock('first_click');
            this.showSpeech();
        }
    },

    showSpeech() {
        const phrases = [
            "Hey! Welcome to my 3D world!",
            "Check out the game signs! 🎮",
            "Try driving a car! Press E near one!",
            "I love Medicine, Engineering & CS!",
            "Visit my house over there! 🏠",
            "Find the vending machine for drinks! 🥤",
            "My school banned game sites... so I built this 😎",
        ];
        const bubble = document.getElementById('speechBubble');
        const text = document.getElementById('speechText');
        text.textContent = phrases[Math.floor(Math.random() * phrases.length)];
        bubble.style.left = '50%'; bubble.style.top = '35%';
        bubble.classList.remove('hidden');
        clearTimeout(this._speechTimer);
        this._speechTimer = setTimeout(() => bubble.classList.add('hidden'), 3000);
    },

    /* ═══════════ FUN FACTS ═══════════ */

    showFunFact() {
        const ff = this.funFacts;
        const el = document.getElementById('funFactText');
        const c = document.getElementById('funFacts');
        if (!el || !c) return;
        el.textContent = ff.list[ff.current % ff.list.length];
        c.classList.remove('hidden');
        c.style.animation = 'none'; c.offsetHeight; c.style.animation = '';
        ff.current++;
        ff.lastChange = performance.now();
    },

    updateFunFacts() {
        if (performance.now() - this.funFacts.lastChange > this.funFacts.interval) this.showFunFact();
    },

    /* ═══════════ COINS & VENDING ═══════════ */

    addCoin() {
        this.coins++;
        try { localStorage.setItem('mayowa_coins', String(this.coins)); } catch(e) {}
        this.updateCoinDisplay();
        const toast = document.getElementById('coinToast');
        toast.classList.remove('hidden');
        clearTimeout(this._coinTimer);
        this._coinTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
    },

    updateCoinDisplay() { const el = document.getElementById('coinDisplay'); if (el) el.textContent = '🪙 ' + this.coins; },

    buyDrink(drinkId) {
        const status = document.getElementById('vendingStatus');
        if (this.coins < 1) { status.textContent = '❌ Not enough coins!'; status.style.color = '#FF5252'; return; }
        const names = { cola:'Cola', juice:'Juice', water:'Water', boba:'Boba Tea' };
        this.coins--;
        try { localStorage.setItem('mayowa_coins', String(this.coins)); } catch(e) {}
        this.updateCoinDisplay();
        status.textContent = `✅ Bought ${names[drinkId] || 'Drink'}! Refreshing!`;
        status.style.color = '#4DB6AC';
        setTimeout(() => this.closeModal('vendingModal'), 1500);
    },

    /* ═══════════ ROOM DRAWING ═══════════ */

    drawRoom() {
        const c = document.getElementById('roomCanvas'); if (!c) return;
        const ctx = c.getContext('2d'); const W = c.width, H = c.height;
        ctx.fillStyle = '#5D4037'; ctx.fillRect(0, H*0.6, W, H*0.4);
        ctx.strokeStyle = '#4E342E'; ctx.lineWidth = 1;
        for (let y = H*0.6; y < H; y += 25) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
        const wg = ctx.createLinearGradient(0,0,0,H*0.6);
        wg.addColorStop(0,'#6A7FDB'); wg.addColorStop(1,'#5C6BC0');
        ctx.fillStyle = wg; ctx.fillRect(0,0,W,H*0.6);
        ctx.fillStyle = '#fff'; ctx.fillRect(0,H*0.6-4,W,8);
        // Posters
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(50,30,90,120);
        ctx.fillStyle = '#FF5252'; ctx.font = 'bold 14px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.fillText('🎮',95,75);
        ctx.fillStyle = '#fff'; ctx.font = '8px "Press Start 2P"'; ctx.fillText('GAME',95,100);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.strokeRect(50,30,90,120);
        ctx.fillStyle = '#FFE0EC'; ctx.fillRect(170,20,80,110);
        ctx.fillStyle = '#FF6B9D'; ctx.font = 'bold 28px serif'; ctx.fillText('桜',210,75);
        ctx.strokeStyle = '#f48fb1'; ctx.lineWidth = 2; ctx.strokeRect(170,20,80,110);
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(520,25,100,70);
        ctx.fillStyle = '#FF0000'; ctx.font = 'bold 11px "Press Start 2P"'; ctx.fillText('ROBLOX',570,55);
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.strokeRect(520,25,100,70);
        // Desk + monitor
        ctx.fillStyle = '#6D4C41'; ctx.fillRect(300,H*0.42,250,15);
        ctx.fillStyle = '#111'; ctx.fillRect(370,H*0.2,120,85);
        ctx.fillStyle = '#1a1a3e'; ctx.fillRect(375,H*0.2+4,110,75);
        ctx.fillStyle = '#39FF14'; ctx.font = '7px monospace'; ctx.textAlign = 'left';
        ['function play() {','  score++;','  render();','}'].forEach((l,i) => ctx.fillText(l,380,H*0.2+18+i*13));
        ctx.fillStyle = '#333'; ctx.fillRect(420,H*0.2+85,20,15);
        // Bed
        ctx.fillStyle = '#4527A0'; ctx.fillRect(20,H*0.55,180,80);
        ctx.fillStyle = '#7E57C2'; ctx.fillRect(20,H*0.55,180,25);
        ctx.fillStyle = '#E8EAF6'; ctx.beginPath(); ctx.ellipse(55,H*0.55+12,30,14,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#3E2723'; ctx.fillRect(15,H*0.53,190,6);
        // Bookshelf
        ctx.fillStyle = '#5D4037'; ctx.fillRect(600,H*0.3,80,130);
        const bc = ['#FF5252','#2196F3','#4CAF50','#FF9800','#9C27B0','#FFEB3B'];
        for (let i = 0; i < 6; i++) { ctx.fillStyle = bc[i]; ctx.fillRect(608+(i%3)*22,H*0.3+6+Math.floor(i/3)*42,16,34); }
    },

    drawAboutChar() {
        const c = document.getElementById('aboutCharCanvas'); if (!c) return;
        const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
        const s = 4, ox = 22, oy = 8;
        const px = (x,y,w,h) => ctx.fillRect(ox+x*s,oy+y*s,w*s,h*s);
        ctx.fillStyle = '#1a1a1a'; px(-5,0,10,6); px(-6,2,12,4); px(-6,6,2,9); px(4,6,2,9);
        ctx.fillStyle = '#e53935'; px(-5,2,2,2);
        ctx.fillStyle = '#8D6E4C'; px(-4,6,8,8);
        ctx.fillStyle = '#111'; px(-3,8,2,2); px(1,8,2,2);
        ctx.fillStyle = '#fff'; px(-2,12,4,1);
        ctx.fillStyle = '#FF9800'; px(-5,16,10,5);
        ctx.fillStyle = '#8D6E4C'; px(-7,17,2,5); px(5,17,2,5);
        ctx.fillStyle = '#ccc'; px(-4,21,8,3);
        ctx.fillStyle = '#8D6E4C'; px(-4,24,3,3); px(1,24,3,3);
        ctx.fillStyle = '#222'; px(-5,27,4,2); px(1,27,4,2);
    },

    /* ═══════════ MODALS & GAMES ═══════════ */

    openModal(id) { document.getElementById(id).classList.remove('hidden'); },
    closeModal(id) { document.getElementById(id).classList.add('hidden'); },
    launchGame(id) { this.closeModal('gamesModal'); this.openModal('gamePlayModal'); Games.launch(id); },
    closeGame() { Games.stop(); this.closeModal('gamePlayModal'); },
    toggleMusic() {
        const btn = document.getElementById('musicToggle');
        if (AudioManager.playing) { AudioManager.stop(); btn.textContent = '🎵 Music: OFF'; }
        else { AudioManager.start(); btn.textContent = '🎵 Music: ON'; Achievements.unlock('music_lover'); }
    },

    /* ═══════════ CONTACT & VISITORS ═══════════ */

    setupContactForm() {
        const form = document.getElementById('contactForm'); if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const status = document.getElementById('formStatus');
            const fd = new FormData(form);
            status.textContent = 'Sending...';
            try {
                const r = await fetch(form.action, { method:'POST', body:fd, headers:{'Accept':'application/json'} });
                if (r.ok) { status.textContent = '✅ Message sent!'; status.style.color = '#4DB6AC'; form.reset(); }
                else throw new Error();
            } catch(e) {
                const n = fd.get('name')||'', em = fd.get('email')||'', m = fd.get('message')||'';
                window.open(`mailto:fazemayhyper12@gmail.com?subject=${encodeURIComponent('Portfolio Message from '+n)}&body=${encodeURIComponent(`From: ${n} (${em})\n\n${m}`)}`);
                status.textContent = '📧 Opening email client...'; status.style.color = '#FFD54F';
            }
        });
    },

    trackVisitor() {
        try {
            let v = parseInt(localStorage.getItem('mayowa_total_visits'))||0;
            const last = localStorage.getItem('mayowa_last_visit_date'), today = new Date().toDateString();
            if (last !== today) { v++; localStorage.setItem('mayowa_total_visits',String(v)); localStorage.setItem('mayowa_last_visit_date',today); }
            const el = document.getElementById('visitorCount');
            if (el) el.textContent = v.toLocaleString();
        } catch(e) {}
    },
};
