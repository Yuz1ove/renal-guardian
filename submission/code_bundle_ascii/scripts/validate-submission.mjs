import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const submissionDir = join(root, "submission");
const packageDir = join(submissionDir, "renal_guardian_submission");
const packageZip = join(submissionDir, "renal_guardian_submission.zip");
const demoZip = join(packageDir, "demo_code.zip");
const platformUploadDir = join(submissionDir, "platform_upload_files");
const platformUploadZip = join(submissionDir, "platform_upload_files.zip");
const signingPacketDir = join(submissionDir, "signing_packet");
const signingPacketZip = join(submissionDir, "signing_packet.zip");
const knownUnsignedAttachments = [
  {
    file: "attachment_1_commitment.pdf",
    sha256: "b37b623384798968031add61bd15c2e5a3969da02bbaf2c10fd5f62dd8f0952e",
    label: "附件一參賽單位承諾書"
  },
  {
    file: "attachment_2_copyright_authorization.pdf",
    sha256: "7206695563841164a208ab64976ab7c95c3be16cf14cbb7b9f7ccffda441faf3",
    label: "附件二著作授權同意書"
  }
];

const requiredFiles = [
  "design_board_1.jpg",
  "design_board_2.jpg",
  "product_cutout.jpg",
  "product_cutout_transparent.png",
  "renal_guardian_three_part_system.glb",
  "demo_code.zip",
  "attachment_1_commitment.pdf",
  "attachment_2_copyright_authorization.pdf",
  "attachment_3_personal_data_consent.pdf",
  "platform_field_values_zh.txt",
  "manifest.txt",
  "submission_checklist_zh.md",
  "after_signing_repack_instructions.txt",
  "final_submission_status.txt",
  "judging_copy_zh.txt",
  "technical_specification_zh.md",
  "renal_guardian_brief.pdf",
  "requirements_traceability_zh.md",
  "completion_audit_zh.md",
  "competition_requirements_zh.md",
  "platform_upload_guide_zh.md",
  "runtime_verification_zh.md",
  "glb_model_audit_zh.md",
  "demo_logic_audit_zh.md",
  "final_review_matrix_zh.md",
  "form_copy_variants_zh.txt",
  "checksums_sha256.txt"
];

const expectedPackageZipEntries = [
  "renal_guardian_submission/design_board_1.jpg",
  "renal_guardian_submission/design_board_2.jpg",
  "renal_guardian_submission/product_cutout.jpg",
  "renal_guardian_submission/product_cutout_transparent.png",
  "renal_guardian_submission/renal_guardian_three_part_system.glb",
  "renal_guardian_submission/demo_code.zip",
  "renal_guardian_submission/attachment_1_commitment.pdf",
  "renal_guardian_submission/attachment_2_copyright_authorization.pdf",
  "renal_guardian_submission/attachment_3_personal_data_consent.pdf",
  "renal_guardian_submission/platform_field_values_zh.txt",
  "renal_guardian_submission/manifest.txt",
  "renal_guardian_submission/submission_checklist_zh.md",
  "renal_guardian_submission/judging_copy_zh.txt",
  "renal_guardian_submission/technical_specification_zh.md",
  "renal_guardian_submission/renal_guardian_brief.pdf",
  "renal_guardian_submission/requirements_traceability_zh.md",
  "renal_guardian_submission/completion_audit_zh.md",
  "renal_guardian_submission/competition_requirements_zh.md",
  "renal_guardian_submission/platform_upload_guide_zh.md",
  "renal_guardian_submission/runtime_verification_zh.md",
  "renal_guardian_submission/glb_model_audit_zh.md",
  "renal_guardian_submission/demo_logic_audit_zh.md",
  "renal_guardian_submission/final_review_matrix_zh.md",
  "renal_guardian_submission/form_copy_variants_zh.txt",
  "renal_guardian_submission/checksums_sha256.txt"
];

const expectedDemoZipEntries = [
  "package.json",
  "package-lock.json",
  "index.html",
  "README.md",
  "playwright.runtime.config.mjs",
  "code_readme.txt",
  "platform_field_values_zh.txt",
  "submission_checklist_zh.md",
  "judging_copy_zh.txt",
  "technical_specification_zh.md",
  "requirements_traceability_zh.md",
  "completion_audit_zh.md",
  "competition_requirements_zh.md",
  "platform_upload_guide_zh.md",
  "runtime_verification_zh.md",
  "glb_model_audit_zh.md",
  "demo_logic_audit_zh.md",
  "final_review_matrix_zh.md",
  "form_copy_variants_zh.txt",
  "src/main.js",
  "src/risk.js",
  "src/styles.css",
  "firmware/renal_guardian_monitor.ino",
  "scripts/export-glb.mjs",
  "scripts/validate-glb.mjs",
  "scripts/validate-demo-logic.ts",
  "scripts/validate-runtime.spec.mjs",
  "scripts/package-submission.mjs",
  "scripts/validate-submission.mjs",
  "src/App.tsx",
  "src/main.tsx",
  "src/components/care-demo/CareDemoPage.tsx",
  "src/components/care-demo/SceneCanvas.tsx",
  "src/components/care-demo/DeviceScene.tsx",
  "src/components/care-demo/DeviceModuleCard.tsx",
  "src/components/care-demo/RiskDashboard.tsx",
  "src/components/care-demo/RiskQueue.tsx",
  "src/components/care-demo/DemoModeTabs.tsx",
  "src/components/care-demo/demoFlowData.ts",
  "src/components/care-demo/scenePresets.ts",
  "src/components/care-demo/riskEngine.ts",
  "src/components/care-demo/mockPatients.ts",
  "src/styles/care-demo.css",
  "tools/create_signing_guide.py",
  "tools/generate_brief_pdf.py",
  "tools/generate_submission_assets.py"
];

const expectedPlatformUploadFiles = [
  "01_design_board_1.jpg",
  "02_design_board_2.jpg",
  "03_product_cutout.jpg",
  "04_attachment_1_commitment.pdf",
  "05_attachment_2_copyright_authorization.pdf",
  "06_attachment_3_personal_data_consent.pdf",
  "README_UPLOAD_ORDER_zh.txt",
  "optional_supplemental/renal_guardian_three_part_system.glb",
  "optional_supplemental/demo_code.zip",
  "optional_supplemental/renal_guardian_brief.pdf",
  "optional_supplemental/platform_upload_guide_zh.md",
  "optional_supplemental/final_review_matrix_zh.md"
];

const expectedPlatformUploadZipEntries = expectedPlatformUploadFiles.map(
  (name) => `platform_upload_files/${name}`
);

const expectedSigningPacketFiles = [
  "01_print_and_sign_attachment_1.pdf",
  "02_attachment_1_signature_position_guide.png",
  "02_attachment_1_signature_position_guide.pdf",
  "03_print_and_sign_attachment_2.pdf",
  "04_attachment_2_signature_position_guide.png",
  "04_attachment_2_signature_position_guide.pdf",
  "05_review_attachment_3_personal_data_consent.pdf",
  "06_attachment_3_signature_date_guide.png",
  "06_attachment_3_signature_date_guide.pdf",
  "README_SIGNING_STEPS_zh.txt"
];

const expectedSigningPacketZipEntries = expectedSigningPacketFiles.map(
  (name) => `signing_packet/${name}`
);

let failures = 0;
let warnings = 0;

function pass(message) {
  console.log(`OK ${message}`);
}

function warn(message) {
  warnings += 1;
  console.warn(`WARN ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`FAIL ${message}`);
}

function ensureFile(path, label) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    fail(`missing ${label}`);
    return false;
  }
  pass(`${label} exists (${Math.round(statSync(path).size / 1024)} KB)`);
  return true;
}

function pngSize(path) {
  const data = readFileSync(path);
  const signature = data.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") throw new Error("not a PNG");
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20)
  };
}

function jpegSize(path) {
  const data = readFileSync(path);
  if (data[0] !== 0xff || data[1] !== 0xd8) throw new Error("not a JPEG");
  let offset = 2;
  while (offset < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = data[offset + 1];
    const length = data.readUInt16BE(offset + 2);
    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isStartOfFrame) {
      return {
        height: data.readUInt16BE(offset + 5),
        width: data.readUInt16BE(offset + 7)
      };
    }
    offset += 2 + length;
  }
  throw new Error("JPEG size marker not found");
}

function checkImage(path, label, reader) {
  try {
    const size = reader(path);
    if (size.width === 4961 && size.height === 3508) {
      pass(`${label} size ${size.width}x${size.height}`);
    } else {
      fail(`${label} expected 4961x3508, got ${size.width}x${size.height}`);
    }
  } catch (error) {
    fail(`${label} could not be read: ${error.message}`);
  }
}

function checkMaxSize(path, label, maxBytes) {
  const size = statSync(path).size;
  if (size <= maxBytes) {
    pass(`${label} size limit ${Math.round(size / 1024)} KB <= ${Math.round(maxBytes / 1024)} KB`);
  } else {
    fail(`${label} exceeds size limit: ${Math.round(size / 1024)} KB`);
  }
}

function checkDpi300(path, label) {
  const result = spawnSync("sips", ["-g", "dpiWidth", "-g", "dpiHeight", path], { encoding: "utf8" });
  if (result.status !== 0) {
    warn(`${label} DPI metadata could not be checked with sips`);
    return;
  }
  const widthMatch = result.stdout.match(/dpiWidth:\s*([0-9.]+)/);
  const heightMatch = result.stdout.match(/dpiHeight:\s*([0-9.]+)/);
  const dpiWidth = widthMatch ? Number(widthMatch[1]) : 0;
  const dpiHeight = heightMatch ? Number(heightMatch[1]) : 0;
  if (Math.round(dpiWidth) === 300 && Math.round(dpiHeight) === 300) {
    pass(`${label} DPI ${dpiWidth} x ${dpiHeight}`);
  } else {
    fail(`${label} expected 300 DPI, got ${dpiWidth} x ${dpiHeight}`);
  }
}

function zipEntries(path) {
  const result = spawnSync("unzip", ["-Z1", path], { encoding: "utf8" });
  if (result.status !== 0) {
    fail(`could not inspect zip: ${path}`);
    return [];
  }
  return result.stdout.split("\n").filter(Boolean);
}

function isAscii(text) {
  return /^[\x00-\x7F]*$/.test(text);
}

function checkZip(path, label, expectedEntries, asciiOnly = true) {
  if (!ensureFile(path, label)) return;
  const entries = zipEntries(path);
  const entrySet = new Set(entries);
  expectedEntries.forEach((entry) => {
    if (entrySet.has(entry)) pass(`${label} contains ${entry}`);
    else fail(`${label} missing ${entry}`);
  });
  if (asciiOnly) {
    const nonAscii = entries.filter((entry) => !isAscii(entry));
    if (nonAscii.length === 0) pass(`${label} filenames are ASCII`);
    else fail(`${label} has non-ASCII filenames: ${nonAscii.join(", ")}`);
  }
}

function checkGlb(path) {
  const result = spawnSync("node", ["scripts/validate-glb.mjs", path], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.stdout.trim()) console.log(result.stdout.trim());
  if (result.stderr.trim()) console.error(result.stderr.trim());
  if (result.status === 0) pass("renal_guardian_three_part_system.glb structure validated");
  else fail("renal_guardian_three_part_system.glb structure validation failed");
}

function checkDemoLogic() {
  const result = spawnSync("npm", ["run", "validate:demo"], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.stdout.trim()) console.log(result.stdout.trim());
  if (result.stderr.trim()) console.error(result.stderr.trim());
  if (result.status === 0) pass("demo risk logic validated");
  else fail("demo risk logic validation failed");
}

function checkChecksums() {
  const checksumPath = join(packageDir, "checksums_sha256.txt");
  if (!ensureFile(checksumPath, "checksums_sha256.txt")) return;
  const text = readFileSync(checksumPath, "utf8");
  [
    "design_board_1.jpg",
    "design_board_2.jpg",
    "product_cutout.jpg",
    "product_cutout_transparent.png",
    "renal_guardian_three_part_system.glb",
    "demo_code.zip",
    "renal_guardian_brief.pdf",
    "attachment_1_commitment.pdf",
    "attachment_2_copyright_authorization.pdf",
    "attachment_3_personal_data_consent.pdf",
    "completion_audit_zh.md",
    "competition_requirements_zh.md",
    "platform_upload_guide_zh.md",
    "runtime_verification_zh.md",
    "glb_model_audit_zh.md",
    "demo_logic_audit_zh.md",
    "final_review_matrix_zh.md"
  ].forEach((name) => {
    if (text.includes(`  ${name}`)) pass(`checksums_sha256.txt lists ${name}`);
    else fail(`checksums_sha256.txt missing ${name}`);
  });
}

function checkPlatformUploadFolder() {
  if (!existsSync(platformUploadDir)) {
    fail("missing submission/platform_upload_files directory");
    return;
  }
  pass("submission/platform_upload_files directory exists");
  expectedPlatformUploadFiles.forEach((name) => ensureFile(join(platformUploadDir, name), `platform_upload_files/${name}`));
  [
    ["01_design_board_1.jpg", jpegSize],
    ["02_design_board_2.jpg", jpegSize],
    ["03_product_cutout.jpg", jpegSize]
  ].forEach(([name, reader]) => {
    const path = join(platformUploadDir, name);
    checkImage(path, `platform_upload_files/${name}`, reader);
    checkMaxSize(path, `platform_upload_files/${name}`, 5 * 1024 * 1024);
    checkDpi300(path, `platform_upload_files/${name}`);
  });
  checkZip(platformUploadZip, "platform_upload_files.zip", expectedPlatformUploadZipEntries);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function checkAttachmentSignatureState() {
  knownUnsignedAttachments.forEach(({ file, sha256: unsignedSha256, label }) => {
    const path = join(packageDir, file);
    if (!existsSync(path)) return;
    const digest = sha256(path);
    if (digest === unsignedSha256) {
      warn(`${file} matches the known unsigned baseline; ${label} still needs handwritten signature/stamp before upload`);
    } else {
      pass(`${file} differs from the known unsigned baseline; manually confirm the visible signature/stamp before upload`);
    }
  });
  if (existsSync(join(packageDir, "attachment_3_personal_data_consent.pdf"))) {
    pass("attachment_3_personal_data_consent.pdf is present; manually confirm visible signature and date before upload");
  }
}

function checkSigningPacket() {
  if (!existsSync(signingPacketDir)) {
    fail("missing submission/signing_packet directory");
    return;
  }
  pass("submission/signing_packet directory exists");
  expectedSigningPacketFiles.forEach((name) => ensureFile(join(signingPacketDir, name), `signing_packet/${name}`));
  checkZip(signingPacketZip, "signing_packet.zip", expectedSigningPacketZipEntries);
}

function main() {
  if (!existsSync(packageDir)) fail("missing submission/renal_guardian_submission directory");
  else pass("submission/renal_guardian_submission directory exists");

  requiredFiles.forEach((name) => ensureFile(join(packageDir, name), name));

  checkImage(join(packageDir, "design_board_1.jpg"), "design_board_1.jpg", jpegSize);
  checkImage(join(packageDir, "design_board_2.jpg"), "design_board_2.jpg", jpegSize);
  checkImage(join(packageDir, "product_cutout.jpg"), "product_cutout.jpg", jpegSize);
  checkImage(join(packageDir, "product_cutout_transparent.png"), "product_cutout_transparent.png", pngSize);
  ["design_board_1.jpg", "design_board_2.jpg", "product_cutout.jpg"].forEach((name) => {
    checkMaxSize(join(packageDir, name), name, 5 * 1024 * 1024);
    checkDpi300(join(packageDir, name), name);
  });
  checkGlb(join(packageDir, "renal_guardian_three_part_system.glb"));
  checkDemoLogic();

  checkZip(packageZip, "renal_guardian_submission.zip", expectedPackageZipEntries);
  checkZip(demoZip, "demo_code.zip", expectedDemoZipEntries);
  checkPlatformUploadFolder();
  checkSigningPacket();
  if (existsSync(join(packageDir, "product_cutout.png"))) {
    fail("legacy product_cutout.png should not be in the formal upload folder; use product_cutout.jpg");
  } else {
    pass("legacy product_cutout.png is absent from formal upload folder");
  }
  checkChecksums();

  checkAttachmentSignatureState();

  if (failures > 0) {
    console.error(`\nSubmission validation failed: ${failures} issue(s), ${warnings} warning(s).`);
    process.exit(1);
  }
  console.log(`\nSubmission validation passed with ${warnings} warning(s).`);
}

main();
