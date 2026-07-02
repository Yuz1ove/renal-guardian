import "./styles.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { calculateDialysisRisk } from "./risk.js";

const palette = {
  graphite: 0x18313a,
  graphiteSoft: 0x2d4650,
  teal: 0x2f8f86,
  mint: 0x9fe4d9,
  porcelain: 0xf8fbfa,
  brass: 0xe0b84c,
  coral: 0xc95b56,
  ink: 0x10191f
};

function roundedBox(width, height, depth, color, roughness = 0.5) {
  const geometry = new THREE.BoxGeometry(width, height, depth, 4, 4, 4);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.08
  });
  return new THREE.Mesh(geometry, material);
}

function makeTextPlane(lines, width, height, options = {}) {
  const scale = 180;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");

  function render(nextLines) {
    const rows = Array.isArray(nextLines) ? nextLines : [nextLines];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = options.background || "#eef7f4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = options.color || "#18313a";
    ctx.font = `700 ${options.fontSize || 42}px "Noto Sans TC", Arial, sans-serif`;
    ctx.textBaseline = "top";
    rows.forEach((line, index) => {
      ctx.fillText(line, 26, 22 + index * (options.lineHeight || 54));
    });
  }

  render(lines);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.userData.setLines = (nextLines) => {
    render(nextLines);
    texture.needsUpdate = true;
  };
  return mesh;
}

function addStatusBar(group, x, y, z, width, color, value = 1) {
  const track = roundedBox(width, 0.035, 0.035, 0xd9e4e0, 0.4);
  track.position.set(x, y, z);
  group.add(track);
  const bar = roundedBox(width * value, 0.045, 0.045, color, 0.35);
  bar.position.set(x - (width - width * value) / 2, y, z + 0.02);
  group.add(bar);
}

function makeDeviceBase(width, depth, labelColor = palette.teal) {
  const group = new THREE.Group();
  const plinth = roundedBox(width, 0.12, depth, 0xf4faf8, 0.46);
  plinth.position.y = -0.82;
  group.add(plinth);
  const stripe = roundedBox(width * 0.72, 0.03, 0.05, labelColor, 0.35);
  stripe.position.set(0, -0.74, depth / 2 + 0.03);
  group.add(stripe);
  return group;
}

function makeWearable() {
  const group = new THREE.Group();
  group.add(makeDeviceBase(1.7, 0.86));
  const strapTop = roundedBox(0.5, 1.05, 0.08, palette.graphite, 0.72);
  strapTop.position.set(0, 1.08, -0.04);
  group.add(strapTop);
  const strapBottom = roundedBox(0.5, 1.05, 0.08, palette.graphite, 0.72);
  strapBottom.position.set(0, -1.08, -0.04);
  group.add(strapBottom);

  const caseBody = roundedBox(1.34, 1.32, 0.18, palette.ink, 0.38);
  caseBody.position.z = 0.14;
  group.add(caseBody);

  const screen = makeTextPlane(["14:30", "HR 92", "BP 112/72", "FALL OK"], 1.12, 1.04, {
    background: "#eaf7f3",
    color: "#18313a",
    fontSize: 30,
    lineHeight: 42
  });
  screen.name = "wearableScreen";
  screen.position.z = 0.24;
  group.add(screen);

  const fallLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 28, 16),
    new THREE.MeshStandardMaterial({
      color: palette.mint,
      emissive: palette.mint,
      emissiveIntensity: 0.5
    })
  );
  fallLight.name = "riskLight";
  fallLight.position.set(0.42, -0.48, 0.32);
  group.add(fallLight);

  const title = makeTextPlane(["1 洗腎者佩戴裝置", "時間 / 心率 / 血壓 / 跌倒偵測"], 1.85, 0.42, {
    background: "rgba(255,255,255,0.92)",
    color: "#2f8f86",
    fontSize: 26,
    lineHeight: 45
  });
  title.name = "deviceLabel";
  title.position.set(0, -1.2, 0.16);
  group.add(title);

  group.position.set(-2.25, 0.18, 0.42);
  group.rotation.set(-0.08, -0.18, 0.05);
  return group;
}

function makeBedsideDetector() {
  const group = new THREE.Group();
  const bed = roundedBox(2.05, 0.24, 1.1, 0xffffff, 0.52);
  bed.position.set(0.18, -0.84, -0.24);
  group.add(bed);
  const pillow = roundedBox(0.58, 0.16, 0.44, 0xdff2ed, 0.4);
  pillow.position.set(0.74, -0.64, -0.24);
  group.add(pillow);
  const base = roundedBox(1.65, 0.34, 1.05, palette.porcelain, 0.34);
  base.position.y = -0.56;
  group.add(base);

  const mast = roundedBox(0.12, 1.35, 0.12, palette.graphiteSoft, 0.45);
  mast.position.set(-0.55, 0.1, -0.18);
  group.add(mast);

  const head = roundedBox(1.42, 0.88, 0.15, palette.ink, 0.42);
  head.position.set(0, 0.72, 0.08);
  group.add(head);

  const screen = makeTextPlane(["活動狀態 78%", "床邊通話 ON", "SOS 待命"], 1.18, 0.66, {
    background: "#f2fbf8",
    color: "#18313a",
    fontSize: 32,
    lineHeight: 50
  });
  screen.name = "bedsideScreen";
  screen.position.set(0, 0.72, 0.18);
  group.add(screen);

  const camera = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 32, 16),
    new THREE.MeshStandardMaterial({ color: palette.graphite, roughness: 0.22 })
  );
  camera.position.set(-0.49, 1.02, 0.28);
  group.add(camera);

  const sos = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.06, 40),
    new THREE.MeshStandardMaterial({
      color: palette.coral,
      emissive: palette.coral,
      emissiveIntensity: 0.25
    })
  );
  sos.rotation.x = Math.PI / 2;
  sos.name = "riskLight";
  sos.position.set(0.48, -0.34, 0.42);
  group.add(sos);

  addStatusBar(group, 0.0, -0.35, 0.4, 0.82, palette.teal, 0.78);
  [0.55, 0.78, 1.02].forEach((radius, index) => {
    const wave = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.01, 8, 96),
      new THREE.MeshBasicMaterial({
        color: palette.mint,
        transparent: true,
        opacity: 0.22 - index * 0.04
      })
    );
    wave.rotation.x = Math.PI / 2;
    wave.position.set(0.18, -0.42, -0.24);
    group.add(wave);
  });

  const title = makeTextPlane(["2 床邊檢測器", "活動偵測 / 報警求救 / 對話聯繫"], 1.9, 0.42, {
    background: "rgba(255,255,255,0.92)",
    color: "#2f8f86",
    fontSize: 26,
    lineHeight: 45
  });
  title.name = "deviceLabel";
  title.position.set(0, -1.13, 0.18);
  group.add(title);

  group.position.set(0, -0.03, 0.1);
  group.rotation.y = -0.05;
  return group;
}

function makeOfficeDashboard() {
  const group = new THREE.Group();
  group.add(makeDeviceBase(2.45, 0.78, palette.coral));
  const board = roundedBox(2.25, 1.62, 0.1, palette.ink, 0.38);
  board.position.z = 0.03;
  group.add(board);
  const stand = roundedBox(0.16, 0.56, 0.12, palette.graphiteSoft, 0.42);
  stand.position.set(0, -1.03, -0.02);
  group.add(stand);

  const header = makeTextPlane(["3 居服員辦公室", "即時健康指數看板"], 1.9, 0.34, {
    background: "#12242c",
    color: "#9fe4d9",
    fontSize: 28,
    lineHeight: 48
  });
  header.position.set(0, 0.55, 0.11);
  group.add(header);

  const rows = [
    ["侯冠宇", "82", palette.teal, 0.82],
    ["林阿姨", "74", palette.brass, 0.74],
    ["陳伯伯", "36", palette.coral, 0.36]
  ];
  rows.forEach(([name, score, color, value], index) => {
    const y = 0.15 - index * 0.38;
    const row = makeTextPlane([`${name}   ${score}`], 1.75, 0.18, {
      background: "#eef7f4",
      color: index === 2 ? "#8f3030" : "#18313a",
      fontSize: 28,
      lineHeight: 42
    });
    if (index === 0) row.name = "officeCurrentRow";
    row.position.set(0, y, 0.12);
    group.add(row);
    addStatusBar(group, 0.34, y - 0.13, 0.15, 1.08, color, value);
  });

  const alert = makeTextPlane(["ALERT", "低於 40 立即派員"], 1.0, 0.36, {
    background: "#c95b56",
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 50
  });
  alert.name = "officeAlert";
  alert.position.set(0.57, -0.72, 0.14);
  group.add(alert);

  group.position.set(2.28, 0.2, -0.1);
  group.rotation.y = -0.24;
  return group;
}

function makeProductSystem() {
  const group = new THREE.Group();
  group.add(makeWearable());
  group.add(makeBedsideDetector());
  group.add(makeOfficeDashboard());

  const lineMaterial = new THREE.LineBasicMaterial({
    color: palette.teal,
    transparent: true,
    opacity: 0.72
  });
  [
    [[-1.45, 0.2, 0.2], [-0.72, 0.33, 0.15]],
    [[0.82, 0.3, 0.1], [1.45, 0.42, 0.0]]
  ].forEach((pair) => {
    const curve = new THREE.CatmullRomCurve3(pair.map((p) => new THREE.Vector3(...p)));
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(20)), lineMaterial);
    group.add(line);
  });

  return group;
}

function setupScene(container, options = {}) {
  const canvas = options.canvas || document.createElement("canvas");
  if (!options.canvas) container.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: options.alpha || false,
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  if (!options.alpha) scene.background = new THREE.Color(options.background || 0xdfeae6);

  const camera = new THREE.PerspectiveCamera(options.fov || 38, 1, 0.1, 100);
  camera.position.set(options.cameraX || 0.2, options.cameraY || 2.35, options.cameraZ || 6.8);
  camera.lookAt(options.lookAtX || 0, options.lookAtY ?? -0.12, options.lookAtZ || 0);

  const ambient = new THREE.HemisphereLight(0xffffff, 0x8ba6a2, 2.2);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 3.1);
  key.position.set(3.5, 5, 4);
  key.castShadow = true;
  scene.add(key);

  const fill = new THREE.PointLight(0x9fe4d9, 2.6, 7);
  fill.position.set(-3, 1.7, 2.6);
  scene.add(fill);

  const product = makeProductSystem();
  product.scale.setScalar(options.scale || 1);
  product.rotation.y = options.rotationY || 0;
  scene.add(product);

  if (!options.alpha) {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.8, 96),
      new THREE.MeshStandardMaterial({
        color: 0xcfdeda,
        roughness: 0.86
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.02;
    floor.receiveShadow = true;
    scene.add(floor);
  }

  const controls = options.controls
    ? new OrbitControls(camera, renderer.domElement)
    : null;
  if (controls) {
    controls.enableDamping = true;
    controls.minDistance = 3.2;
    controls.maxDistance = 8;
    controls.target.set(0, -0.12, 0);
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, !options.canvas);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock();
  function animate() {
    const t = clock.getElapsedTime();
    product.rotation.y = (options.rotationY || 0) + Math.sin(t * 0.32) * 0.07;
    product.position.y = (options.productY || 0) + Math.sin(t * 0.55) * 0.035;
    product.traverse((obj) => {
      if (obj.name === "riskLight" && obj.material?.emissiveIntensity != null) {
        obj.material.emissiveIntensity = 0.45 + Math.sin(t * 2.4) * 0.18;
      }
    });
    controls?.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  new ResizeObserver(resize).observe(container);
  animate();

  return { product, renderer, scene, camera };
}

function setRiskTone(product, tone) {
  const colors = {
    stable: palette.mint,
    watch: 0x55a6d9,
    warning: palette.brass,
    critical: palette.coral
  };
  product.traverse((obj) => {
    if (obj.name !== "riskLight" || !obj.material) return;
    obj.material.color.setHex(colors[tone] || palette.teal);
    obj.material.emissive.setHex(colors[tone] || palette.teal);
  });
}

function bindRiskControls(product) {
  const inputs = {
    systolicBp: document.getElementById("bpInput"),
    heartRate: document.getElementById("hrInput"),
    activityIndex: document.getElementById("activityInput"),
    fallDetected: document.getElementById("fallInput")
  };
  const outputs = {
    systolicBp: document.getElementById("bpValue"),
    heartRate: document.getElementById("hrValue"),
    activityIndex: document.getElementById("activityValue"),
    fallDetected: document.getElementById("fallValue")
  };
  const riskCard = document.getElementById("riskCard");
  const riskLabel = document.getElementById("riskLabel");
  const riskScore = document.getElementById("riskScore");
  const riskCopy = document.getElementById("riskCopy");
  const currentPatient = document.getElementById("patientCurrent");
  const currentPatientMeter = document.getElementById("patientCurrentMeter");
  const currentPatientScore = document.getElementById("patientCurrentScore");
  const dispatchNote = document.getElementById("dispatchNote");
  const liveSurfaces = {
    wearable: product.getObjectByName("wearableScreen"),
    bedside: product.getObjectByName("bedsideScreen"),
    officeRow: product.getObjectByName("officeCurrentRow"),
    officeAlert: product.getObjectByName("officeAlert")
  };

  function update() {
    const values = {
      systolicBp: Number(inputs.systolicBp.value),
      heartRate: Number(inputs.heartRate.value),
      activityIndex: Number(inputs.activityIndex.value),
      fallDetected: Number(inputs.fallDetected.value) === 1
    };
    outputs.systolicBp.value = `${values.systolicBp} mmHg`;
    outputs.heartRate.value = `${values.heartRate} bpm`;
    outputs.activityIndex.value = `${values.activityIndex} / 100`;
    outputs.fallDetected.value = values.fallDetected ? "已偵測" : "未偵測";

    const risk = calculateDialysisRisk(values);
    const needsDispatch = risk.score <= 40 || values.fallDetected;
    riskCard.className = `risk-card ${risk.tone}`;
    riskLabel.textContent = risk.level;
    riskScore.textContent = risk.score;
    riskCopy.textContent = risk.message;
    currentPatient.className = `patient-row current ${needsDispatch ? "alert" : ""}`;
    currentPatientMeter.value = risk.score;
    currentPatientScore.textContent = risk.score;
    dispatchNote.textContent =
      needsDispatch
        ? "侯冠宇健康指數低於門檻，辦公室看板已標示派員並開啟床邊通話。"
        : "低於 40 會標示派員；跌倒偵測會立即開啟求救與通話。";

    const now = new Date();
    const timeText = now.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    liveSurfaces.wearable?.userData.setLines?.([
      timeText,
      `HR ${values.heartRate}`,
      `BP ${values.systolicBp}/72`,
      values.fallDetected ? "FALL !" : "FALL OK"
    ]);
    liveSurfaces.bedside?.userData.setLines?.([
      `活動狀態 ${values.activityIndex}%`,
      needsDispatch ? "床邊通話 OPEN" : "床邊通話 ON",
      values.fallDetected ? "SOS 求救" : "SOS 待命"
    ]);
    liveSurfaces.officeRow?.userData.setLines?.([`侯冠宇   ${risk.score}`]);
    liveSurfaces.officeAlert?.userData.setLines?.(
      needsDispatch ? ["ALERT", "立即派員"] : ["WATCH", "低於 40 派員"]
    );
    setRiskTone(product, risk.tone);
  }

  Object.values(inputs).forEach((input) => input.addEventListener("input", update));
  update();
}

function configureExportMode() {
  const params = new URLSearchParams(window.location.search);
  const target = params.get("export");
  if (!target) return null;
  document.body.classList.add("export-mode");
  document.querySelector(".stage-shell").style.display = "none";
  const selected = document.getElementById(target);
  selected?.classList.add("export");
  return target;
}

const exportTarget = configureExportMode();

if (!exportTarget) {
  const mainScene = setupScene(document.getElementById("modelStage"), {
    canvas: document.getElementById("renalCanvas"),
    controls: true,
    fov: 42,
    scale: 0.62,
    cameraY: 2.0,
    cameraZ: 9.4,
    lookAtY: -0.08,
    productY: 0.28
  });
  bindRiskControls(mainScene.product);
} else if (exportTarget === "posterOne") {
  setupScene(document.getElementById("posterModelOne"), {
    fov: 42,
    scale: 0.95,
    cameraY: 0.95,
    cameraZ: 5.7,
    lookAtY: -0.08,
    rotationY: -0.16,
    background: 0xe2ece8
  });
} else if (exportTarget === "cutout") {
  const cutoutScene = setupScene(document.getElementById("cutoutModel"), {
    alpha: true,
    fov: 39,
    scale: 0.62,
    cameraY: 1.5,
    cameraZ: 8.9,
    lookAtY: -0.22,
    rotationY: -0.04
  });
  cutoutScene.product.traverse((obj) => {
    if (obj.name === "deviceLabel") obj.visible = false;
  });
}
