// Setup Scene (Final Tuning)
const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();
const fogColorPink = new THREE.Color(0x990033);
const fogColorNight = new THREE.Color(0x2e001f);
scene.fog = new THREE.FogExp2(fogColorPink, 0.008);
scene.background = fogColorPink;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
// Start HIGH and BACK
camera.position.set(0, 12, 25);
camera.rotation.x = -0.4;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Post Processing
const renderScene = new THREE.RenderPass(scene, camera);
const composer = new THREE.EffectComposer(renderer);
composer.addPass(renderScene);

const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, 0.4, 0.85
);
bloomPass.threshold = 0.6;
bloomPass.strength = 0.8;
bloomPass.radius = 0.4;
composer.addPass(bloomPass);

// ------------------------------------------------------------------
// World Generation
// ------------------------------------------------------------------

const mountainGeo = new THREE.PlaneGeometry(100, 100, 40, 40);
const posAttribute = mountainGeo.attributes.position;
const vertex = new THREE.Vector3();

for (let i = 0; i < posAttribute.count; i++) {
    vertex.fromBufferAttribute(posAttribute, i);
    let noise = (Math.random() - 0.5) * 4;
    if (Math.abs(vertex.x) < 8) noise *= 0.05;
    let heightOffset = 0;
    if (Math.abs(vertex.x) > 10) heightOffset = Math.random() * 10;
    vertex.z += noise + heightOffset;
    if (vertex.y < -10) vertex.z -= 20;
    posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
}
mountainGeo.computeVertexNormals();

const mountainMat = new THREE.MeshStandardMaterial({
    color: 0xb08d99, // Darker Muted Pink/Grey to reduce glare
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true
});

const mountain = new THREE.Mesh(mountainGeo, mountainMat);
mountain.rotation.x = -Math.PI / 2;
mountain.position.y = -5;
scene.add(mountain);

// 2. Stairs (Dark Grey)
const stairsGroup = new THREE.Group();
const stairMat = new THREE.MeshStandardMaterial({
    color: 0x666666, // Darker Grey
    roughness: 0.7,
    metalness: 0.2,
    emissive: 0x000000
});

const stepWidth = 10;
const stepHeight = 1;
const stepDepth = 2;
const stepsCount = 120;

for (let i = 0; i < stepsCount; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth), stairMat);
    const zPos = -10 - (i * stepDepth);
    const yPos = -5 - (i * stepHeight);

    step.position.set(0, yPos, zPos);
    stairsGroup.add(step);

    if (i % 8 === 0) {
        const pillar = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3, 4), mountainMat);
        pillar.position.set(stepWidth / 1.5, yPos + 1.5, zPos);
        stairsGroup.add(pillar);
        const pillar2 = pillar.clone();
        pillar2.position.set(-stepWidth / 1.5, yPos + 1.5, zPos);
        stairsGroup.add(pillar2);
    }
}
scene.add(stairsGroup);

// 3. Filler Elements
const fillerGroup = new THREE.Group();
const fillerGeo = new THREE.IcosahedronGeometry(1);
const fillerMat = new THREE.MeshStandardMaterial({ color: 0x884466, flatShading: true });

for (let i = 0; i < 200; i++) {
    const mesh = new THREE.Mesh(fillerGeo, fillerMat);
    mesh.position.set(
        (Math.random() - 0.5) * 80,
        - (Math.random() * 100),
        - (Math.random() * 250)
    );
    mesh.scale.setScalar(Math.random() * 3);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    fillerGroup.add(mesh);
}
scene.add(fillerGroup);


// 4. The Ocean (Many Bubbles)
const oceanGroup = new THREE.Group();
const oceanLimitY = -5 - (stepsCount * stepHeight);
const oceanLimitZ = -10 - (stepsCount * stepDepth);

const oceanFloorGeo = new THREE.PlaneGeometry(300, 300, 20, 20);
const oceanFloorMat = new THREE.MeshStandardMaterial({ color: 0x1a001a, roughness: 1 });
const oceanFloor = new THREE.Mesh(oceanFloorGeo, oceanFloorMat);
oceanFloor.rotation.x = -Math.PI / 2;
oceanFloor.position.set(0, oceanLimitY - 30, oceanLimitZ - 50);
oceanGroup.add(oceanFloor);

// A. Big Spheres
const bubbleGeo = new THREE.SphereGeometry(0.2, 8, 8);
const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xff00cc, transparent: true, opacity: 0.6 });
for (let i = 0; i < 2500; i++) { // Increased from 800 to 2500
    const b = new THREE.Mesh(bubbleGeo, bubbleMat);
    b.position.set(
        (Math.random() - 0.5) * 100,
        oceanLimitY + 10 + (Math.random() * 50),
        oceanLimitZ - (Math.random() * 200)
    );
    b.scale.setScalar(Math.random() * 2);
    oceanGroup.add(b);
}

// B. Micro Bubbles (Particles) for density
const particlesGeo = new THREE.BufferGeometry();
const particlesCount = 2000;
const pPos = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount * 3; i++) {
    pPos[i] = (Math.random() - 0.5) * 100; // Spread X, Y, Z randomly
    if (i % 3 === 1) pPos[i] = oceanLimitY + 10 + (Math.random() * 50); // Y restriction
    if (i % 3 === 2) pPos[i] = oceanLimitZ - (Math.random() * 200); // Z restriction
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const particlesMat = new THREE.PointsMaterial({
    size: 0.1,
    color: 0xff00cc,
    transparent: true,
    opacity: 0.8
});
const particles = new THREE.Points(particlesGeo, particlesMat);
oceanGroup.add(particles);

scene.add(oceanGroup);


// Lights (Dimmer)
const ambientLight = new THREE.AmbientLight(0xffcccc, 0.25); // Was 0.4
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffaa00, 0.5); // Was 0.8
dirLight.position.set(20, 50, 20);
dirLight.castShadow = true;
scene.add(dirLight);

const pLight = new THREE.PointLight(0xff00ff, 1, 30);
scene.add(pLight);

const clock = new THREE.Clock();
function animate() {
    const t = clock.getElapsedTime();
    fillerGroup.children.forEach((m, i) => m.rotation.y += 0.005);
    // Animate Bubbles Vertical
    oceanGroup.children.forEach((b, i) => {
        if (b.isMesh) b.position.y += Math.sin(t + i) * 0.005 + 0.005;
    });
    // Animate Particles
    // (Simple wiggle, could be fancier but good for bubble static)

    pLight.position.copy(camera.position);
    composer.render();
    requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});


// ------------------------------------------------------------------
// Scroll Logic (Same Safe Path)
// ------------------------------------------------------------------
gsap.registerPlugin(ScrollTrigger);

const stairEndY = oceanLimitY + 25;
const stairEndZ = oceanLimitZ;
const oceanEnd = { z: oceanLimitZ - 100 };

const tlMain = gsap.timeline({
    scrollTrigger: {
        trigger: ".scroll-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5
    }
});

tlMain.to(camera.position, {
    x: 0,
    y: stairEndY,
    z: stairEndZ,
    ease: "none",
    duration: 65
});

tlMain.to(camera.position, {
    z: oceanEnd.z,
    y: stairEndY - 10,
    ease: "none",
    duration: 35
});

const fogStart = { r: 0.6, g: 0.0, b: 0.2 };
const fogEnd = { r: 0.18, g: 0.0, b: 0.12 };

gsap.to(fogStart, {
    r: fogEnd.r, g: fogEnd.g, b: fogEnd.b,
    scrollTrigger: {
        trigger: ".scroll-container",
        start: "40% top",
        end: "80% top",
        scrub: true,
        onUpdate: () => {
            scene.fog.color.setRGB(fogStart.r, fogStart.g, fogStart.b);
            scene.background.setRGB(fogStart.r, fogStart.g, fogStart.b);
        }
    }
});

function tSection(id, start, end) {
    gsap.timeline({
        scrollTrigger: {
            trigger: ".scroll-container", start: `${start}% top`, end: `${end}% top`, scrub: true,
            onEnter: () => document.querySelector(id).classList.add('active'),
            onLeave: () => document.querySelector(id).classList.remove('active'),
            onEnterBack: () => document.querySelector(id).classList.add('active'),
            onLeaveBack: () => document.querySelector(id).classList.remove('active'),
        }
    }).to(id, { opacity: 1, duration: 1 }).to(id, { opacity: 0, delay: 2, duration: 1 });
}
gsap.to('#hero', { opacity: 0, scrollTrigger: { trigger: ".scroll-container", start: "top top", end: "8% top", scrub: true } });
tSection('#intro', 10, 24);
tSection('#services', 28, 44);
tSection('#process', 48, 64);
tSection('#history', 68, 84);
gsap.timeline({
    scrollTrigger: {
        trigger: ".scroll-container", start: "90% top", end: "bottom bottom", scrub: true,
        onEnter: () => document.querySelector('#contact').classList.add('active'),
        onLeaveBack: () => document.querySelector('#contact').classList.remove('active')
    }
}).to('#contact', { opacity: 1 });

const cursor = document.querySelector('.cursor');
const follower = document.querySelector('.cursor-follower');
document.addEventListener('mousemove', (e) => {
    gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
    gsap.to(follower, { x: e.clientX - 15, y: e.clientY - 15, duration: 0.2 });
});
