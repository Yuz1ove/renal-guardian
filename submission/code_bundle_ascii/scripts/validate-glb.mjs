import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const target = resolve(process.argv[2] || "腎安守護-三端式照護系統.glb");

const requiredNodeNames = [
  "RenalGuardian_three_terminal_care_system",
  "01_wearable_device_time_hr_bp_fall",
  "02_bedside_activity_detector_alarm_call",
  "03_care_worker_office_health_index_dashboard",
  "screen_time_hr_bp_fall",
  "bedside_display_activity_call_sos",
  "low_health_index_dispatch_alert",
  "sos_alarm_button",
  "wearable_time_display_tile",
  "wearable_heart_rate_tile",
  "wearable_blood_pressure_tile",
  "wearable_fall_detection_tile",
  "wearable_manual_sos_side_button",
  "bedside_activity_sensor_coverage_ring",
  "bedside_two_way_call_microphone",
  "bedside_speaker_grille_for_voice_contact",
  "bedside_alarm_siren_light",
  "office_patient_hou_health_index_row",
  "office_patient_lin_health_index_row",
  "office_patient_chen_health_index_row",
  "office_low_health_threshold_line_40",
  "office_dispatch_now_button"
];

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`OK ${message}`);
}

function readGlbJson(path) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    fail(`missing GLB file: ${path}`);
  }
  const data = readFileSync(path);
  if (data.length < 20) fail("GLB file is too small");
  if (data.toString("utf8", 0, 4) !== "glTF") fail("GLB magic header is not glTF");
  const version = data.readUInt32LE(4);
  if (version !== 2) fail(`expected glTF 2.0 binary, got version ${version}`);
  const declaredLength = data.readUInt32LE(8);
  if (declaredLength !== data.length) {
    fail(`GLB declared length ${declaredLength} does not match file size ${data.length}`);
  }

  let offset = 12;
  while (offset + 8 <= data.length) {
    const chunkLength = data.readUInt32LE(offset);
    const chunkType = data.toString("utf8", offset + 4, offset + 8);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;
    if (chunkEnd > data.length) fail(`GLB chunk ${chunkType} exceeds file size`);
    if (chunkType === "JSON") {
      const jsonText = data.toString("utf8", chunkStart, chunkEnd).trim();
      return JSON.parse(jsonText);
    }
    offset = chunkEnd;
  }
  fail("GLB JSON chunk not found");
}

function main() {
  const json = readGlbJson(target);
  if (json.asset?.version !== "2.0") fail("asset.version is not 2.0");
  pass("asset.version is 2.0");

  const nodes = json.nodes || [];
  const nodeNames = new Set(nodes.map((node) => node.name).filter(Boolean));
  requiredNodeNames.forEach((name) => {
    if (nodeNames.has(name)) pass(`node exists: ${name}`);
    else fail(`missing required node: ${name}`);
  });

  const meshCount = (json.meshes || []).length;
  const materialCount = (json.materials || []).length;
  const sceneCount = (json.scenes || []).length;
  if (sceneCount < 1) fail("GLB has no scene");
  if (meshCount < 40) fail(`expected at least 40 meshes, got ${meshCount}`);
  if (materialCount < 6) fail(`expected at least 6 materials, got ${materialCount}`);
  pass(`scene count ${sceneCount}`);
  pass(`mesh count ${meshCount}`);
  pass(`material count ${materialCount}`);

  const hasBinaryBuffer = (json.buffers || []).some((buffer) => buffer.byteLength > 0);
  if (!hasBinaryBuffer) fail("GLB has no binary geometry buffer");
  pass("binary geometry buffer exists");

  console.log(`GLB validation passed: ${target}`);
}

main();
