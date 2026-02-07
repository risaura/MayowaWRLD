/* ═══════════════════════════════════════════
   LOADER — Animated Solar System (Three.js)
   Realistic planets, glowing sun, orbits
   ═══════════════════════════════════════════ */

const Loader = {
    scene: null, camera: null, renderer: null,
    planets: [], sun: null, stars: null,

    init() {
        const canvas = document.getElementById('loaderCanvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000005);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 60, 120);
        this.camera.lookAt(0, 0, 0);

        // Ambient light
        this.scene.add(new THREE.AmbientLight(0x111122, 0.3));

        this.createStars();
        this.createSun();
        this.createPlanets();

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.animate();
        this.simulateLoading();
    },

    createGlowTexture(color, size) {
        const c = document.createElement('canvas');
        c.width = c.height = size || 128;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(c.width/2, c.height/2, 0, c.width/2, c.height/2, c.width/2);
        g.addColorStop(0, color);
        g.addColorStop(0.15, color);
        g.addColorStop(0.4, color.slice(0,-1) + ',0.3)');
        g.addColorStop(0.7, color.slice(0,-1) + ',0.08)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, c.width, c.height);
        return new THREE.CanvasTexture(c);
    },

    createStars() {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(6000);
        const colors = new Float32Array(6000);
        for (let i = 0; i < 6000; i += 3) {
            const r = 300 + Math.random() * 700;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i] = r * Math.sin(phi) * Math.cos(theta);
            positions[i+1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i+2] = r * Math.cos(phi);
            const bright = 0.5 + Math.random() * 0.5;
            colors[i] = bright; colors[i+1] = bright; colors[i+2] = 0.8 + Math.random() * 0.2;
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        this.stars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.8, vertexColors: true, transparent: true, opacity: 0.9 }));
        this.scene.add(this.stars);
    },

    createSun() {
        // Sun sphere
        const sunGeo = new THREE.SphereGeometry(6, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xFDB813 });
        this.sun = new THREE.Mesh(sunGeo, sunMat);
        this.scene.add(this.sun);

        // Sun light
        const light = new THREE.PointLight(0xFFF5E0, 2, 500);
        this.scene.add(light);

        // Inner corona glow
        const innerGlow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.createGlowTexture('rgba(253,184,19,1)', 256),
            transparent: true, blending: THREE.AdditiveBlending,
        }));
        innerGlow.scale.set(28, 28, 1);
        this.scene.add(innerGlow);

        // Outer corona
        const outerGlow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.createGlowTexture('rgba(255,140,50,1)', 256),
            transparent: true, blending: THREE.AdditiveBlending, opacity: 0.4,
        }));
        outerGlow.scale.set(50, 50, 1);
        this.scene.add(outerGlow);
    },

    createPlanets() {
        const planetData = [
            { name:'Mercury', r:0.5,  orbit:12,  speed:4.15,  color:0x8C7853, glow:'rgba(140,120,83,1)' },
            { name:'Venus',   r:0.9,  orbit:17,  speed:1.62,  color:0xFFC649, glow:'rgba(255,198,73,1)' },
            { name:'Earth',   r:1.0,  orbit:24,  speed:1.0,   color:0x6B93D6, glow:'rgba(107,147,214,1)', moon:true },
            { name:'Mars',    r:0.65, orbit:32,  speed:0.53,  color:0xC1440E, glow:'rgba(193,68,14,1)' },
            { name:'Jupiter', r:2.8,  orbit:48,  speed:0.084, color:0xD8CA9D, glow:'rgba(216,202,157,1)' },
            { name:'Saturn',  r:2.2,  orbit:65,  speed:0.034, color:0xEAD6B8, glow:'rgba(234,214,184,1)', rings:true },
            { name:'Uranus',  r:1.4,  orbit:82,  speed:0.012, color:0xACE5EE, glow:'rgba(172,229,238,1)' },
            { name:'Neptune', r:1.3,  orbit:98,  speed:0.006, color:0x5B5DDF, glow:'rgba(91,93,223,1)' },
        ];

        planetData.forEach(p => {
            const group = new THREE.Group();

            // Planet sphere
            const geo = new THREE.SphereGeometry(p.r, 24, 24);
            const mat = new THREE.MeshStandardMaterial({
                color: p.color, roughness: 0.7, metalness: 0.1,
                emissive: p.color, emissiveIntensity: 0.15,
            });
            const mesh = new THREE.Mesh(geo, mat);
            group.add(mesh);

            // Planet glow
            const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: this.createGlowTexture(p.glow, 128),
                transparent: true, blending: THREE.AdditiveBlending, opacity: 0.6,
            }));
            glowSprite.scale.set(p.r * 5, p.r * 5, 1);
            group.add(glowSprite);

            // Saturn rings
            if (p.rings) {
                const ringGeo = new THREE.RingGeometry(p.r * 1.4, p.r * 2.2, 48);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: 0xD4C5A9, side: THREE.DoubleSide,
                    transparent: true, opacity: 0.6,
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI * 0.4;
                group.add(ring);
            }

            // Earth's moon
            if (p.moon) {
                const moonGeo = new THREE.SphereGeometry(0.25, 16, 16);
                const moonMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.9 });
                const moonMesh = new THREE.Mesh(moonGeo, moonMat);
                group.userData.moon = moonMesh;
                group.add(moonMesh);
            }

            // Orbit path (faint ring)
            const orbitGeo = new THREE.RingGeometry(p.orbit - 0.05, p.orbit + 0.05, 128);
            const orbitMat = new THREE.MeshBasicMaterial({
                color: 0x334466, side: THREE.DoubleSide,
                transparent: true, opacity: 0.15,
            });
            const orbitLine = new THREE.Mesh(orbitGeo, orbitMat);
            orbitLine.rotation.x = -Math.PI / 2;
            this.scene.add(orbitLine);

            this.scene.add(group);
            this.planets.push({ group, data: p, angle: Math.random() * Math.PI * 2 });
        });
    },

    animate() {
        if (document.getElementById('loader').classList.contains('done')) {
            this.cleanup();
            return;
        }
        requestAnimationFrame(() => this.animate());

        const t = performance.now() / 1000;

        // Rotate sun
        if (this.sun) this.sun.rotation.y = t * 0.1;

        // Orbit planets
        this.planets.forEach(p => {
            p.angle += p.data.speed * 0.008;
            const x = Math.cos(p.angle) * p.data.orbit;
            const z = Math.sin(p.angle) * p.data.orbit;
            p.group.position.set(x, 0, z);

            // Spin planet
            p.group.children[0].rotation.y += 0.01;

            // Moon orbit
            if (p.group.userData.moon) {
                const moon = p.group.userData.moon;
                moon.position.set(
                    Math.cos(t * 2) * 2.2,
                    0,
                    Math.sin(t * 2) * 2.2
                );
            }
        });

        // Slow camera orbit
        this.camera.position.x = Math.sin(t * 0.08) * 35 + Math.cos(t * 0.03) * 80;
        this.camera.position.z = Math.cos(t * 0.08) * 35 + Math.sin(t * 0.03) * 80;
        this.camera.position.y = 40 + Math.sin(t * 0.15) * 15;
        this.camera.lookAt(0, 0, 0);

        // Twinkle stars
        if (this.stars) {
            this.stars.rotation.y += 0.0001;
        }

        this.renderer.render(this.scene, this.camera);
    },

    simulateLoading() {
        const bar = document.getElementById('loaderBar');
        const status = document.getElementById('loaderStatus');
        const pct = document.getElementById('loaderPercent');
        const steps = [
            [15, 'SCANNING MERCURY ORBIT...'],
            [28, 'CHARTING VENUS TRAJECTORY...'],
            [40, 'CALIBRATING EARTH SYSTEMS...'],
            [52, 'MAPPING MARS TERRAIN...'],
            [65, 'ANALYZING JUPITER STORMS...'],
            [75, 'THREADING SATURN\'S RINGS...'],
            [85, 'REACHING OUTER PLANETS...'],
            [95, 'ENGAGING WARP DRIVE...'],
            [100, 'WELCOME HOME, EXPLORER'],
        ];

        let i = 0;
        const next = () => {
            if (i >= steps.length) {
                setTimeout(() => {
                    document.getElementById('loader').classList.add('done');
                    document.getElementById('hud').classList.remove('hidden');
                    document.getElementById('controlsHint').classList.remove('hidden');
                    if (typeof App !== 'undefined') App.start();
                }, 600);
                return;
            }
            const [p, s] = steps[i];
            bar.style.width = p + '%';
            status.textContent = s;
            pct.textContent = p + '%';
            i++;
            setTimeout(next, 400 + Math.random() * 500);
        };
        setTimeout(next, 800);
    },

    cleanup() {
        if (this.renderer) {
            this.renderer.dispose();
            this.scene = null;
            this.camera = null;
            this.planets = [];
        }
    }
};

// Auto-start
window.addEventListener('DOMContentLoaded', () => {
    if (typeof THREE !== 'undefined') {
        Loader.init();
    } else {
        // Fallback if THREE not loaded yet
        const check = setInterval(() => {
            if (typeof THREE !== 'undefined') {
                clearInterval(check);
                Loader.init();
            }
        }, 100);
    }
});
