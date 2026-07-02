import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { writeFile } from "node:fs/promises";

globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    }, (error) => {
      this.error = error;
      this.onerror?.(error);
    });
  }
};

const palette = {
  graphite: 0x18313a,
  graphiteSoft: 0x2d4650,
  teal: 0x2f8f86,
  mint: 0x9fe4d9,
  porcelain: 0xf8fbfa,
  brass: 0xe0b84c,
  coral: 0xc95b56,
  ink: 0x10191f,
  white: 0xffffff
};

function mat(color, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    roughness: 0.48,
    metalness: 0.06
  });
}

function box(width, height, depth, color, name) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat(color));
  mesh.name = name;
  return mesh;
}

function cyl(radius, height, color, name) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 48), mat(color));
  mesh.name = name;
  return mesh;
}

function makeWearable() {
  const group = new THREE.Group();
  group.name = "01_wearable_device_time_hr_bp_fall";
  const strapTop = box(0.5, 1.05, 0.08, palette.graphite, "wearable_top_strap");
  strapTop.position.set(0, 1.08, -0.04);
  const strapBottom = box(0.5, 1.05, 0.08, palette.graphite, "wearable_bottom_strap");
  strapBottom.position.set(0, -1.08, -0.04);
  const body = box(1.34, 1.32, 0.18, palette.ink, "wearable_case");
  body.position.z = 0.14;
  const screen = box(1.12, 1.04, 0.035, 0xeaf7f3, "screen_time_hr_bp_fall");
  screen.position.z = 0.25;
  const fallLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 32, 16),
    mat(palette.mint, palette.mint, 0.6)
  );
  fallLight.name = "fall_status_light";
  fallLight.position.set(0.42, -0.48, 0.32);
  group.add(strapTop, strapBottom, body, screen, fallLight);
  group.position.set(-2.25, 0.18, 0.42);
  group.rotation.set(-0.08, -0.18, 0.05);
  return group;
}

function makeBedsideDetector() {
  const group = new THREE.Group();
  group.name = "02_bedside_activity_detector_alarm_call";
  const bed = box(2.05, 0.24, 1.1, palette.white, "care_bed");
  bed.position.set(0.18, -0.84, -0.24);
  const pillow = box(0.58, 0.16, 0.44, 0xdff2ed, "bed_pillow");
  pillow.position.set(0.74, -0.64, -0.24);
  const base = box(1.65, 0.34, 1.05, palette.porcelain, "bedside_base");
  base.position.y = -0.56;
  const mast = box(0.12, 1.35, 0.12, palette.graphiteSoft, "bedside_stand");
  mast.position.set(-0.55, 0.1, -0.18);
  const head = box(1.42, 0.88, 0.15, palette.ink, "bedside_display_activity_call_sos");
  head.position.set(0, 0.72, 0.08);
  const screen = box(1.18, 0.66, 0.035, 0xf2fbf8, "bedside_screen");
  screen.position.set(0, 0.72, 0.18);
  const camera = new THREE.Mesh(new THREE.SphereGeometry(0.09, 32, 16), mat(palette.graphite));
  camera.name = "two_way_call_camera";
  camera.position.set(-0.49, 1.02, 0.28);
  const sos = cyl(0.16, 0.06, palette.coral, "sos_alarm_button");
  sos.material = mat(palette.coral, palette.coral, 0.3);
  sos.rotation.x = Math.PI / 2;
  sos.position.set(0.48, -0.34, 0.42);
  group.add(bed, pillow, base, mast, head, screen, camera, sos);
  return group;
}

function makeOfficeDashboard() {
  const group = new THREE.Group();
  group.name = "03_care_worker_office_health_index_dashboard";
  const base = box(2.45, 0.12, 0.78, palette.white, "office_dashboard_base");
  base.position.y = -0.82;
  const stand = box(0.16, 0.56, 0.12, palette.graphiteSoft, "office_dashboard_stand");
  stand.position.set(0, -1.03, -0.02);
  const board = box(2.25, 1.62, 0.1, palette.ink, "office_dashboard_board");
  board.position.z = 0.03;
  const alert = box(1.0, 0.36, 0.05, palette.coral, "low_health_index_dispatch_alert");
  alert.position.set(0.57, -0.72, 0.14);
  const rows = [
    [0.82, palette.teal, 0.15],
    [0.74, palette.brass, -0.23],
    [0.36, palette.coral, -0.61]
  ];
  rows.forEach(([value, color, y], index) => {
    const track = box(1.12, 0.06, 0.035, 0xeef7f4, `patient_${index + 1}_health_track`);
    track.position.set(0.28, y, 0.13);
    const bar = box(1.12 * value, 0.08, 0.045, color, `patient_${index + 1}_health_index_bar`);
    bar.position.set(0.28 - (1.12 - 1.12 * value) / 2, y, 0.17);
    group.add(track, bar);
  });
  group.add(base, stand, board, alert);
  group.position.set(2.28, 0.2, -0.1);
  group.rotation.y = -0.24;
  return group;
}

const scene = new THREE.Scene();
const system = new THREE.Group();
system.name = "RenalGuardian_three_terminal_care_system";
system.add(makeWearable(), makeBedsideDetector(), makeOfficeDashboard());
scene.add(system);

const exporter = new GLTFExporter();
const glb = await new Promise((resolve, reject) => {
  exporter.parse(
    scene,
    resolve,
    reject,
    { binary: true, trs: false, onlyVisible: true }
  );
});

await writeFile("腎安守護-三端式照護系統.glb", Buffer.from(glb));
console.log("Exported 腎安守護-三端式照護系統.glb");
