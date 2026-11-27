import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { classifyPose, createSequenceDetector, POSE } from './gestures.mjs';

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const flashEl = $('flash');
const toastEl = $('toast');

function toast(msg, isErr = false) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('err', isErr);
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

/* ---------------------------------------------- Three.js */

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#04050b');
scene.fog = new THREE.FogExp2('#04050b', 0.055);

const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 120);
camera.position.set(0.15, 1.45, 5.6);
camera.lookAt(0, 1.15, 0);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.82, 0.7, 0.2);
composer.addPass(bloom);

/* ---------------------------------------------- nền: sao + lưới */

function makeStars() {
  const n = 1400;
  const pos = new Float32Array(n * 3);
  const size = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const r = 16 + Math.random() * 26;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = Math.abs(r * Math.cos(ph)) * 0.7 + 0.6;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    size[i] = 0.6 + Math.random() * 1.7;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float aSize;
      uniform float uTime;
      varying float vTw;
      void main() {
        vTw = 0.55 + 0.45 * sin(uTime * 1.7 + position.x * 3.1 + position.z * 2.2);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (150.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vTw;
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.0, length(d));
        gl_FragColor = vec4(vec3(0.78, 0.85, 1.0), a * a * vTw * 0.85);
      }
    `,
  });
  return new THREE.Points(g, m);
}
const stars = makeStars();
scene.add(stars);

const grid = new THREE.GridHelper(60, 60, 0x2a3358, 0x141a2c);
grid.position.y = -0.32;
grid.material.transparent = true;
grid.material.opacity = 0.5;
scene.add(grid);

/* ---------------------------------------------- shader quả cầu Tử */

const ORB_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPos;
  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const ORB_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uCharge;
  uniform float uCore;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uHot;
  uniform vec3 uRim;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPos;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.4);

    // Mạch năng lượng cuộn bên trong khối "khối lượng ảo"
    vec3 p = vPos * 2.6;
    float flow = fbm(p + vec3(0.0, uTime * 0.55, uTime * 0.32));
    float swirl = fbm(p * 1.9 + vec3(flow * 1.7, -uTime * 0.42, flow));
    float veins = smoothstep(0.46, 0.5, abs(sin(swirl * 7.5 + uTime * 1.4)) * 0.5 + 0.5);

    vec3 col = mix(uDeep, uMid, smoothstep(0.25, 0.85, flow));
    col = mix(col, uHot, veins * 0.30);
    col += uRim * fres * (0.55 + uCharge * 0.45);
    col *= 0.72 + uCharge * 0.22;
    col += uHot * uCore * 0.30;

    gl_FragColor = vec4(col, 0.42 + fres * 0.55 + veins * 0.12);
  }
`;

const V = {
  deep: new THREE.Color('#3a0a70'),
  mid: new THREE.Color('#9b30ff'),
  hot: new THREE.Color('#f3e2ff'),
};

function makeOrbMaterial(color, charge) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uCharge: { value: charge },
      uCore: { value: 0 },
      uDeep: { value: new THREE.Color(color).multiplyScalar(0.42) },
      uMid: { value: new THREE.Color(color) },
      uHot: { value: new THREE.Color('#ffffff') },
      uRim: { value: new THREE.Color('#d9a3ff') },
    },
    vertexShader: ORB_VERT,
    fragmentShader: ORB_FRAG,
  });
}

function makeSprite(color, size) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.2, color);
  g.addColorStop(0.55, color.replace(/[\d.]+\)$/, '0.35)'));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const s = new THREE.Sprite(mat);
  s.scale.setScalar(size);
  return s;
}

/* ---------------------------------------------- cụm chiêu */

const rig = new THREE.Group();
rig.position.set(0, 1.25, 0);
scene.add(rig);

const blueOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 5), makeOrbMaterial('#1e7bff', 0.35));
const redOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 5), makeOrbMaterial('#ff2036', 0.35));
const blueGlow = makeSprite('rgba(60,170,255,0.95)', 1.5);
const redGlow = makeSprite('rgba(255,60,80,0.95)', 1.5);
blueOrb.add(blueGlow);
redOrb.add(redGlow);
blueOrb.visible = false;
redOrb.visible = false;
rig.add(blueOrb, redOrb);

const purpleOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.52, 5), makeOrbMaterial('#9b30ff', 1));
const purpleGlow = makeSprite('rgba(178,92,255,0.95)', 1.45);
purpleOrb.add(purpleGlow);
purpleOrb.visible = false;
rig.add(purpleOrb);

// Vỏ dây năng lượng
const shell = new THREE.LineSegments(
  new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.62, 2)),
  new THREE.LineBasicMaterial({ color: 0xd9b6ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }),
);
purpleOrb.add(shell);

// Tia điện giữa hai quả cầu
const ARC_COUNT = 7;
const arcGeometry = new THREE.BufferGeometry();
const arcPositions = new Float32Array(ARC_COUNT * 16 * 3);
arcGeometry.setAttribute('position', new THREE.BufferAttribute(arcPositions, 3));
const arcs = new THREE.LineSegments(
  arcGeometry,
  new THREE.LineBasicMaterial({ color: 0xe6ccff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
);
rig.add(arcs);

// Vệt lao đi
const TRAIL = 90;
const trailPositions = new Float32Array(TRAIL * 2 * 3);
const trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
const trail = new THREE.LineSegments(
  trailGeo,
  new THREE.LineBasicMaterial({ color: 0xc77dff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
);
trail.frustumCulled = false;
scene.add(trail);

// Vòng xung kích
const shock = new THREE.Mesh(
  new THREE.RingGeometry(0.9, 1.0, 96),
  new THREE.MeshBasicMaterial({ color: 0xd8b0ff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
);
shock.rotation.x = -Math.PI / 2;
shock.position.set(0, 0.02, 0);
scene.add(shock);

/* ---------------------------------------------- trạng thái */

const S = {
  phase: 'idle', // idle | armed | charged | flying | cooldown
  charge: 0, // 0..1 mức nạp
  merge: 0, // 0 = hai quả cầu xa nhau, 1 = chạm nhau
  flight: 0, // 0..1 tiến trình lao đi
  spin: 0,
  since: 0,
};

const FLIGHT_DIR = new THREE.Vector3(0.3, 0.02, -0.95).normalize();
const FLIGHT_TIME = 1.55;

const ui = {
  step1: $('step-1'),
  step2: $('step-2'),
  step3: $('step-3'),
  badgeCam: $('badge-cam'),
  badgePose: $('badge-pose'),
  badgeFps: $('badge-fps'),
  poseDot: $('pose-dot'),
  poseText: $('pose-text'),
  mState: $('m-state'),
  mTime: $('m-time'),
  btnCam: $('btn-cam'),
  btnFire: $('btn-fire'),
};

function setSteps(stage) {
  const idx = stage === 'armed' ? 1 : stage === 'charged' ? 2 : stage === 'flying' ? 3 : 0;
  [ui.step1, ui.step2, ui.step3].forEach((el, i) => {
    el.classList.toggle('active', idx === i + 1);
    el.classList.toggle('done', idx > i + 1);
  });
}

function arm() {
  if (S.phase !== 'idle' && S.phase !== 'cooldown') return;
  S.phase = 'armed';
  S.since = performance.now();
  blueOrb.visible = true;
  setSteps('armed');
  toast('Thương đã hình thành — chuyển sang ấn 2');
}

function charge() {
  if (S.phase !== 'armed') return;
  S.phase = 'charged';
  S.since = performance.now();
  redOrb.visible = true;
  setSteps('charged');
  toast('Hách xuất hiện — chụm tay rồi bung ra');
}

function fire(source = 'gesture') {
  if (S.phase === 'flying') return;
  S.phase = 'flying';
  S.since = performance.now();
  S.flight = 0;
  purpleOrb.visible = true;
  purpleOrb.position.set(0, 0, 0);
  purpleOrb.scale.setScalar(0.55);
  blueOrb.visible = false;
  redOrb.visible = false;
  setSteps('flying');
  flash();
  toast(source === 'gesture' ? '虛式「茈」— Hư Thức Tử!' : 'Kích hoạt bằng bàn phím');
}

function reset() {
  S.phase = 'idle';
  S.charge = 0;
  S.merge = 0;
  S.flight = 0;
  blueOrb.visible = false;
  redOrb.visible = false;
  purpleOrb.visible = false;
  purpleOrb.position.set(0, 0, 0);
  shock.material.opacity = 0;
  trail.material.opacity = 0;
  arcs.material.opacity = 0;
  setSteps('idle');
}

function flash() {
  flashEl.style.transition = 'none';
  flashEl.style.opacity = '0.85';
  requestAnimationFrame(() => {
    flashEl.style.transition = 'opacity .55s ease-out';
    flashEl.style.opacity = '0';
  });
}

/* ---------------------------------------------- cập nhật mỗi khung */

let lastT = performance.now();
let fpsAcc = 0;
let fpsFrames = 0;

function updateArcs(t) {
  const a = blueOrb.position;
  const b = redOrb.position;
  const seg = 8;
  for (let i = 0; i < ARC_COUNT; i += 1) {
    const jitter = 0.06 + Math.random() * 0.16 * (1 - S.merge * 0.5);
    let prev = null;
    for (let s = 0; s <= seg; s += 1) {
      const k = s / seg;
      const x = a.x + (b.x - a.x) * k + (Math.random() - 0.5) * jitter;
      const y = a.y + (b.y - a.y) * k + (Math.random() - 0.5) * jitter;
      const z = a.z + (b.z - a.z) * k + (Math.random() - 0.5) * jitter;
      if (prev) {
        const o = (i * seg + s - 1) * 3;
        arcPositions[o] = prev.x;
        arcPositions[o + 1] = prev.y;
        arcPositions[o + 2] = prev.z;
        arcPositions[o + 3] = x;
        arcPositions[o + 4] = y;
        arcPositions[o + 5] = z;
      }
      prev = { x, y, z };
    }
  }
  arcGeometry.attributes.position.needsUpdate = true;
  arcs.material.opacity = 0.35 + 0.5 * S.merge + 0.1 * Math.sin(t * 24);
}

function updateTrail() {
  const head = purpleOrb.position.clone();
  const back = head.clone().addScaledVector(FLIGHT_DIR, -2.2);
  for (let i = 0; i < TRAIL; i += 1) {
    const k0 = i / TRAIL;
    const k1 = (i + 1) / TRAIL;
    const wob = 0.09 * S.flight * (1 - k0);
    const x0 = head.x + (back.x - head.x) * k0 + (Math.random() - 0.5) * wob;
    const y0 = head.y + (back.y - head.y) * k0 + (Math.random() - 0.5) * wob;
    const z0 = head.z + (back.z - head.z) * k0 + (Math.random() - 0.5) * wob;
    const o = i * 6;
    trailPositions[o] = x0;
    trailPositions[o + 1] = y0;
    trailPositions[o + 2] = z0;
    trailPositions[o + 3] = x0 + (back.x - head.x) * (k1 - k0);
    trailPositions[o + 4] = y0 + (back.y - head.y) * (k1 - k0);
    trailPositions[o + 5] = z0 + (back.z - head.z) * (k1 - k0);
  }
  trailGeo.attributes.position.needsUpdate = true;
}

function tick() {
  const now = performance.now();
  const dt = Math.min((now - lastT) / 1000, 0.05);
  lastT = now;
  const t = now / 1000;

  fpsAcc += dt;
  fpsFrames += 1;
  if (fpsAcc > 0.5) {
    ui.badgeFps.textContent = `${Math.round(fpsFrames / fpsAcc)} fps`;
    fpsAcc = 0;
    fpsFrames = 0;
  }

  stars.material.uniforms.uTime.value = t;
  stars.rotation.y += dt * 0.008;

  if (HOLD !== null && S.phase === 'flying') {
    S.since = now - HOLD * FLIGHT_TIME * 1000;
  }
  const elapsed = (now - S.since) / 1000;
  ui.mTime.textContent = `${elapsed.toFixed(1)}s`;
  ui.mState.textContent = `trạng thái: ${S.phase}`;

  const wantCharge =
    S.phase === 'armed' ? 0.45 : S.phase === 'charged' ? 1 : S.phase === 'flying' ? 1.4 : 0;
  S.charge += (wantCharge - S.charge) * Math.min(1, dt * 6);
  S.merge += ((S.phase === 'charged' || S.phase === 'flying' ? 1 : 0) - S.merge) * Math.min(1, dt * 4.2);

  // hai quả cầu
  const sep = THREE.MathUtils.lerp(0.85, 0.1, S.merge);
  const orbit = Math.sin(t * 1.6) * 0.06;
  blueOrb.position.set(-sep + orbit, orbit * 0.7, 0.06);
  redOrb.position.set(sep - orbit, -orbit * 0.5, -0.06);
  blueOrb.rotation.y += dt * 1.4;
  redOrb.rotation.y -= dt * 1.4;

  const bs = 0.34 + S.charge * 0.2 + Math.sin(t * 9) * 0.012;
  blueOrb.scale.setScalar(S.phase === 'idle' || S.phase === 'cooldown' ? 0 : bs);
  redOrb.scale.setScalar(S.phase === 'armed' ? 0 : bs * 1.05);

  blueOrb.material.uniforms.uTime.value = t;
  redOrb.material.uniforms.uTime.value = t;
  blueOrb.material.uniforms.uCharge.value = 0.4 + S.charge * 0.7;
  redOrb.material.uniforms.uCharge.value = 0.4 + S.charge * 0.7;
  blueGlow.scale.setScalar(1.35 + S.charge * 0.5);
  redGlow.scale.setScalar(1.35 + S.charge * 0.5);

  if (S.merge > 0.02 && S.phase !== 'flying') {
    updateArcs(t);
  } else {
    arcs.material.opacity *= 0.9;
  }

  // khối Tử
  if (S.phase === 'charged') {
    purpleOrb.visible = true;
    purpleOrb.position.set(0, 0, 0);
    const grow = 0.16 + S.merge * 0.34 + Math.sin(t * 14) * 0.02 * S.merge;
    purpleOrb.scale.setScalar(grow);
  }

  if (S.phase === 'flying') {
    S.flight = Math.min(1, elapsed / FLIGHT_TIME);
    const dist = 13 * S.flight;
    purpleOrb.position.copy(FLIGHT_DIR).multiplyScalar(dist);
    const s = 0.62 + S.flight * 0.55;
    purpleOrb.scale.setScalar(s);
    purpleOrb.rotation.x += dt * 5;
    purpleOrb.rotation.y += dt * 3.4;
    purpleOrb.material.uniforms.uCharge.value = 1.7;
    purpleOrb.material.uniforms.uCore.value = 0.10 + Math.sin(t * 20) * 0.06;
    trail.material.opacity = Math.min(1, S.flight * 3) * 1.0;
    updateTrail();

    if (S.flight > 0.62) {
      const k = (S.flight - 0.62) / 0.38;
      shock.material.opacity = (1 - k) * 1.0;
      shock.scale.setScalar(1 + k * 9);
    }
    if (S.flight >= 1) {
      S.phase = 'cooldown';
      S.since = now;
      purpleOrb.visible = false;
      trail.material.opacity = 0;
      shock.material.opacity = 0;
    }
  } else if (S.phase === 'cooldown') {
    if (elapsed > 1.0) reset();
  }

  purpleOrb.material.uniforms.uTime.value = t;
  shell.material.opacity = S.phase === 'flying' ? 0.32 : 0.12 * S.merge;
  shell.rotation.y -= dt * 0.8;

  // camera sống nhẹ
  camera.position.x = 0.15 + Math.sin(t * 0.32) * 0.16;
  camera.position.y = 1.45 + Math.sin(t * 0.44) * 0.05;
  camera.lookAt(0, 1.15, 0);

  bloom.strength = 0.62 + S.charge * 0.26 + (S.phase === 'flying' ? 0.18 : 0);

  composer.render();
  requestAnimationFrame(tick);
}

/* ---------------------------------------------- webcam + hand landmarker */

const video = $('video');
const camWrap = $('cam-wrap');
const detector = createSequenceDetector();
let landmarker = null;
let camOn = false;
let lastPose = POSE.NONE;

function poseLabel(p) {
  if (p === POSE.SIGN_1) return 'ấn 1 (trỏ + út)';
  if (p === POSE.SIGN_2) return 'ấn 2 (chụm cái + trỏ)';
  if (p === POSE.RELEASED) return 'bung tay';
  return 'không khớp ấn';
}

async function startCam() {
  ui.btnCam.disabled = true;
  ui.badgeCam.textContent = 'webcam: đang nạp model…';
  try {
    const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
    const fileset = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm',
    );
    landmarker = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.55,
      minTrackingConfidence: 0.5,
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    camWrap.classList.remove('hidden');
    camOn = true;
    ui.badgeCam.textContent = 'webcam: đang theo dõi';
    ui.badgeCam.classList.add('on');
    ui.btnCam.textContent = 'Tắt webcam';
    toast('Đưa tay vào khung: làm ấn 1 → ấn 2 → bung tay');
    detectLoop();
  } catch (err) {
    console.error(err);
    ui.badgeCam.textContent = 'webcam: lỗi';
    ui.badgeCam.classList.add('warn');
    ui.btnCam.disabled = false;
    toast(`Không bật được webcam/model: ${err?.message ?? err}. Dùng nút "Bắn" để xem hiệu ứng.`, true);
  }
}

function stopCam() {
  camOn = false;
  const stream = video.srcObject;
  if (stream) stream.getTracks().forEach((tr) => tr.stop());
  video.srcObject = null;
  camWrap.classList.add('hidden');
  ui.badgeCam.textContent = 'webcam: đã tắt';
  ui.badgeCam.classList.remove('on');
  ui.btnCam.textContent = 'Bật webcam';
  ui.btnCam.disabled = false;
  detector.reset();
  reset();
}

let lastVideoTime = -1;

function detectLoop() {
  if (!camOn || !landmarker) return;
  if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    try {
      const res = landmarker.detectForVideo(video, performance.now());
      const lm = res?.landmarks?.[0];
      const pose = lm ? classifyPose(lm) : POSE.NONE;
      lastPose = pose;
      ui.badgePose.textContent = `ấn: ${poseLabel(pose)}`;
      ui.poseDot.classList.toggle('live', Boolean(lm));
      ui.poseText.textContent = lm
        ? `Đã thấy bàn tay — ${poseLabel(pose)}`
        : 'Không thấy bàn tay trong khung';

      const ev = detector.update(pose, performance.now());
      if (ev === 'arm') arm();
      else if (ev === 'charge') charge();
      else if (ev === 'fire') fire('gesture');
    } catch (err) {
      console.warn('detect lỗi', err);
    }
  }
  requestAnimationFrame(detectLoop);
}

/* ---------------------------------------------- input */

ui.btnCam.addEventListener('click', () => (camOn ? stopCam() : startCam()));
ui.btnFire.addEventListener('click', () => {
  if (S.phase === 'idle' || S.phase === 'cooldown') arm();
  if (S.phase === 'armed') charge();
  fire('key');
});

addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (S.phase === 'idle' || S.phase === 'cooldown') arm();
    if (S.phase === 'armed') charge();
    fire('key');
  }
  if (e.key === '1') arm();
  if (e.key === '2') charge();
  if (e.key === '3') fire('key');
  if (e.key === 'r' || e.key === 'R') reset();
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

/* ---------------------------------------------- hook cho test & ảnh chụp */

window.__gojo = {
  arm,
  charge,
  fire,
  reset,
  state: () => ({ ...S }),
  pose: () => lastPose,
  classifyPose,
  detector,
  ready: true,
};

const params = new URLSearchParams(location.search);
const HOLD = params.get('hold') !== null ? Number(params.get('hold')) : null;
const preset = params.get('state');
if (preset === 'armed') arm();
else if (preset === 'charged') {
  arm();
  charge();
} else if (preset === 'flying') {
  arm();
  charge();
  fire('key');
}

requestAnimationFrame(() => {
  $('loading').classList.add('hide');
  setTimeout(() => $('loading').remove(), 500);
});

lastT = performance.now();
tick();
