import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const submissionDir = join(root, "submission");
const asciiDir = join(submissionDir, "renal_guardian_submission");
const chineseDir = join(submissionDir, "腎安守護_投稿包");
const codeDir = join(submissionDir, "code_bundle_ascii");
const platformUploadDir = join(submissionDir, "platform_upload_files");
const signingPacketDir = join(submissionDir, "signing_packet");

const paths = {
  design1: join(root, "作品設計圖檔1-腎安守護.jpg"),
  design2: join(root, "作品設計圖檔2-腎安守護.jpg"),
  cutoutJpg: join(root, "作品去背圖檔-腎安守護.jpg"),
  cutoutPng: join(root, "作品去背圖檔-腎安守護.png"),
  glb: join(root, "腎安守護-三端式照護系統.glb"),
  checklist: join(root, "投稿欄位與檔案檢查表.md"),
  attachment1: join(root, "submission", "renal_guardian_submission", "attachment_1_commitment.pdf"),
  attachment2: join(root, "submission", "renal_guardian_submission", "attachment_2_copyright_authorization.pdf"),
  attachment3: join(root, "submission", "renal_guardian_submission", "attachment_3_personal_data_consent.pdf"),
  fieldValues: join(submissionDir, "platform_field_values_zh.txt"),
  manifest: join(submissionDir, "renal_guardian_manifest.txt"),
  codeReadme: join(submissionDir, "code_readme.txt"),
  finalStatus: join(submissionDir, "final_submission_status.txt"),
  repackInstructions: join(submissionDir, "after_signing_repack_instructions.txt"),
  judgingCopy: join(submissionDir, "judging_copy_zh.txt"),
  technicalSpec: join(submissionDir, "technical_specification_zh.md"),
  briefPdf: join(submissionDir, "renal_guardian_brief.pdf"),
  requirementsTraceability: join(submissionDir, "requirements_traceability_zh.md"),
  completionAudit: join(submissionDir, "completion_audit_zh.md"),
  competitionRequirements: join(submissionDir, "competition_requirements_zh.md"),
  uploadGuide: join(submissionDir, "platform_upload_guide_zh.md"),
  runtimeVerification: join(submissionDir, "runtime_verification_zh.md"),
  glbModelAudit: join(submissionDir, "glb_model_audit_zh.md"),
  demoLogicAudit: join(submissionDir, "demo_logic_audit_zh.md"),
  finalReviewMatrix: join(submissionDir, "final_review_matrix_zh.md"),
  formCopyVariants: join(submissionDir, "form_copy_variants_zh.txt")
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--attachment1") {
      options.attachment1 = resolve(args[index + 1] || "");
      index += 1;
    } else if (arg === "--attachment2") {
      options.attachment2 = resolve(args[index + 1] || "");
      index += 1;
    } else if (arg === "--attachment3") {
      options.attachment3 = resolve(args[index + 1] || "");
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function printHelp() {
  console.log(`Usage:
  npm run package:submission
  npm run package:submission -- --attachment1 /path/to/signed_attachment_1.pdf
  npm run package:submission -- --attachment1 /path/to/signed_attachment_1.pdf --attachment2 /path/to/signed_attachment_2.pdf

Outputs:
  submission/renal_guardian_submission.zip
  submission/腎安守護_投稿包.zip
  submission/platform_upload_files/
  submission/platform_upload_files.zip
  submission/signing_packet/
  submission/signing_packet.zip

The --attachment1, --attachment2, and --attachment3 options replace attachment PDFs before packaging.
Attachment 1 and 2 require handwritten signature/stamp. Attachment 3 includes signature/date in the current packet, but can be replaced if rescanned.`);
}

function ensureFile(path, label = path) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new Error(`Missing required file: ${label}`);
  }
}

function zipDir(zipName, folderName) {
  const result = spawnSync("zip", ["-qr", zipName, folderName], {
    cwd: submissionDir,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    throw new Error(`zip failed for ${zipName}`);
  }
}

function rebuildCodeBundle() {
  rmSync(codeDir, { recursive: true, force: true });
  mkdirSync(codeDir, { recursive: true });
  ["package.json", "package-lock.json", "index.html", "README.md", "playwright.runtime.config.mjs"].forEach((name) => {
    copyFileSync(join(root, name), join(codeDir, name));
  });
  ["src", "firmware", "scripts", "tools"].forEach((name) => {
    cpSync(join(root, name), join(codeDir, name), { recursive: true });
  });
  copyFileSync(paths.codeReadme, join(codeDir, "code_readme.txt"));
  copyFileSync(paths.fieldValues, join(codeDir, "platform_field_values_zh.txt"));
  copyFileSync(paths.checklist, join(codeDir, "submission_checklist_zh.md"));
  copyFileSync(paths.judgingCopy, join(codeDir, "judging_copy_zh.txt"));
  copyFileSync(paths.technicalSpec, join(codeDir, "technical_specification_zh.md"));
  copyFileSync(paths.requirementsTraceability, join(codeDir, "requirements_traceability_zh.md"));
  copyFileSync(paths.completionAudit, join(codeDir, "completion_audit_zh.md"));
  copyFileSync(paths.competitionRequirements, join(codeDir, "competition_requirements_zh.md"));
  copyFileSync(paths.uploadGuide, join(codeDir, "platform_upload_guide_zh.md"));
  copyFileSync(paths.runtimeVerification, join(codeDir, "runtime_verification_zh.md"));
  copyFileSync(paths.glbModelAudit, join(codeDir, "glb_model_audit_zh.md"));
  copyFileSync(paths.demoLogicAudit, join(codeDir, "demo_logic_audit_zh.md"));
  copyFileSync(paths.finalReviewMatrix, join(codeDir, "final_review_matrix_zh.md"));
  copyFileSync(paths.formCopyVariants, join(codeDir, "form_copy_variants_zh.txt"));

  rmSync(join(submissionDir, "demo_code.zip"), { force: true });
  const result = spawnSync("zip", ["-qr", "../demo_code.zip", "."], {
    cwd: codeDir,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    throw new Error("zip failed for demo_code.zip");
  }
}

function rebuildBriefPdf() {
  const result = spawnSync("python3", ["tools/generate_brief_pdf.py"], {
    cwd: root,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    throw new Error("brief PDF generation failed");
  }
}

function rebuildSigningGuides() {
  const result = spawnSync("python3", ["tools/create_signing_guide.py"], {
    cwd: root,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    throw new Error("signing guide generation failed");
  }
}

function rebuildPlatformUploadFolder() {
  rmSync(platformUploadDir, { recursive: true, force: true });
  mkdirSync(platformUploadDir, { recursive: true });
  const supplementalDir = join(platformUploadDir, "optional_supplemental");
  mkdirSync(supplementalDir, { recursive: true });

  copyFileSync(paths.design1, join(platformUploadDir, "01_design_board_1.jpg"));
  copyFileSync(paths.design2, join(platformUploadDir, "02_design_board_2.jpg"));
  copyFileSync(paths.cutoutJpg, join(platformUploadDir, "03_product_cutout.jpg"));
  copyFileSync(paths.attachment1, join(platformUploadDir, "04_attachment_1_commitment.pdf"));
  copyFileSync(paths.attachment2, join(platformUploadDir, "05_attachment_2_copyright_authorization.pdf"));
  copyFileSync(paths.attachment3, join(platformUploadDir, "06_attachment_3_personal_data_consent.pdf"));

  copyFileSync(paths.glb, join(supplementalDir, "renal_guardian_three_part_system.glb"));
  copyFileSync(join(submissionDir, "demo_code.zip"), join(supplementalDir, "demo_code.zip"));
  copyFileSync(paths.briefPdf, join(supplementalDir, "renal_guardian_brief.pdf"));
  copyFileSync(paths.uploadGuide, join(supplementalDir, "platform_upload_guide_zh.md"));
  copyFileSync(paths.finalReviewMatrix, join(supplementalDir, "final_review_matrix_zh.md"));

  const readme = [
    "腎安守護平台分項上傳檔案",
    "",
    "依平台欄位優先選用：",
    "1. 作品設計稿圖檔 1：01_design_board_1.jpg",
    "2. 作品設計稿圖檔 2：02_design_board_2.jpg",
    "3. 作品去背圖檔：03_product_cutout.jpg",
    "4. 參賽單位承諾書：04_attachment_1_commitment.pdf",
    "5. 著作授權同意書：05_attachment_2_copyright_authorization.pdf",
    "6. 個人資料提供同意書：06_attachment_3_personal_data_consent.pdf",
    "",
    "注意：04_attachment_1_commitment.pdf 與 05_attachment_2_copyright_authorization.pdf 送出前必須由參賽者親筆簽名或蓋章。",
    "06_attachment_3_personal_data_consent.pdf 目前含簽名與日期，上傳前仍請目視確認清楚可讀。",
    "",
    "optional_supplemental/ 內為 3D 模型、示範程式與說明文件，只有平台允許補充資料時再使用。",
    ""
  ];
  writeFileSync(join(platformUploadDir, "README_UPLOAD_ORDER_zh.txt"), readme.join("\n"));
}

function rebuildSigningPacket() {
  const guides = [
    ["attachment_1_signature_guide.png", "attachment_1_signature_guide.pdf"],
    ["attachment_2_signature_guide.png", "attachment_2_signature_guide.pdf"],
    ["attachment_3_signature_date_guide.png", "attachment_3_signature_date_guide.pdf"]
  ];
  guides.flat().forEach((name) => ensureFile(join(submissionDir, "signing_aid", name), name));

  rmSync(signingPacketDir, { recursive: true, force: true });
  mkdirSync(signingPacketDir, { recursive: true });
  copyFileSync(paths.attachment1, join(signingPacketDir, "01_print_and_sign_attachment_1.pdf"));
  copyFileSync(join(submissionDir, "signing_aid", "attachment_1_signature_guide.png"), join(signingPacketDir, "02_attachment_1_signature_position_guide.png"));
  copyFileSync(join(submissionDir, "signing_aid", "attachment_1_signature_guide.pdf"), join(signingPacketDir, "02_attachment_1_signature_position_guide.pdf"));
  copyFileSync(paths.attachment2, join(signingPacketDir, "03_print_and_sign_attachment_2.pdf"));
  copyFileSync(join(submissionDir, "signing_aid", "attachment_2_signature_guide.png"), join(signingPacketDir, "04_attachment_2_signature_position_guide.png"));
  copyFileSync(join(submissionDir, "signing_aid", "attachment_2_signature_guide.pdf"), join(signingPacketDir, "04_attachment_2_signature_position_guide.pdf"));
  copyFileSync(paths.attachment3, join(signingPacketDir, "05_review_attachment_3_personal_data_consent.pdf"));
  copyFileSync(join(submissionDir, "signing_aid", "attachment_3_signature_date_guide.png"), join(signingPacketDir, "06_attachment_3_signature_date_guide.png"));
  copyFileSync(join(submissionDir, "signing_aid", "attachment_3_signature_date_guide.pdf"), join(signingPacketDir, "06_attachment_3_signature_date_guide.pdf"));

  const readme = [
    "腎安守護附件簽名交接包",
    "",
    "1. 開啟或列印 01_print_and_sign_attachment_1.pdf，參考 02_attachment_1_signature_position_guide.png/pdf，在附件一底部親筆簽名或蓋章。",
    "2. 開啟或列印 03_print_and_sign_attachment_2.pdf，參考 04_attachment_2_signature_position_guide.png/pdf，在附件二授權人/簽名欄親筆簽名或蓋章。",
    "3. 05_review_attachment_3_personal_data_consent.pdf 目前含簽名與日期；請參考 06_attachment_3_signature_date_guide.png/pdf 目視確認清楚可讀，必要時重新簽名掃描。",
    "4. 將完成簽名的附件掃描或匯出成 PDF。",
    "5. 回到專案根目錄執行，例如：",
    "",
    "   npm run package:submission -- --attachment1 /path/to/signed_attachment_1.pdf --attachment2 /path/to/signed_attachment_2.pdf",
    "",
    "若附件三也重新掃描，可加上：",
    "",
    "   --attachment3 /path/to/signed_attachment_3.pdf",
    "",
    "6. 驗證投稿包：",
    "",
    "   npm run validate:submission",
    "",
    "注意：不要用打字或圖片代簽；需要簽名處均須由參賽者本人親筆簽名或蓋章。",
    ""
  ];
  writeFileSync(join(signingPacketDir, "README_SIGNING_STEPS_zh.txt"), readme.join("\n"));
}

function copyCommonFiles() {
  mkdirSync(asciiDir, { recursive: true });
  rmSync(join(asciiDir, "product_cutout.png"), { force: true });
  copyFileSync(paths.design1, join(asciiDir, "design_board_1.jpg"));
  copyFileSync(paths.design2, join(asciiDir, "design_board_2.jpg"));
  copyFileSync(paths.cutoutJpg, join(asciiDir, "product_cutout.jpg"));
  copyFileSync(paths.cutoutPng, join(asciiDir, "product_cutout_transparent.png"));
  copyFileSync(paths.glb, join(asciiDir, "renal_guardian_three_part_system.glb"));
  copyFileSync(paths.attachment2, join(asciiDir, "attachment_2_copyright_authorization.pdf"));
  copyFileSync(paths.attachment3, join(asciiDir, "attachment_3_personal_data_consent.pdf"));
  copyFileSync(paths.fieldValues, join(asciiDir, "platform_field_values_zh.txt"));
  copyFileSync(paths.manifest, join(asciiDir, "manifest.txt"));
  copyFileSync(paths.checklist, join(asciiDir, "submission_checklist_zh.md"));
  copyFileSync(paths.finalStatus, join(asciiDir, "final_submission_status.txt"));
  copyFileSync(paths.repackInstructions, join(asciiDir, "after_signing_repack_instructions.txt"));
  copyFileSync(paths.judgingCopy, join(asciiDir, "judging_copy_zh.txt"));
  copyFileSync(paths.technicalSpec, join(asciiDir, "technical_specification_zh.md"));
  copyFileSync(paths.requirementsTraceability, join(asciiDir, "requirements_traceability_zh.md"));
  copyFileSync(paths.completionAudit, join(asciiDir, "completion_audit_zh.md"));
  copyFileSync(paths.competitionRequirements, join(asciiDir, "competition_requirements_zh.md"));
  copyFileSync(paths.uploadGuide, join(asciiDir, "platform_upload_guide_zh.md"));
  copyFileSync(paths.runtimeVerification, join(asciiDir, "runtime_verification_zh.md"));
  copyFileSync(paths.glbModelAudit, join(asciiDir, "glb_model_audit_zh.md"));
  copyFileSync(paths.demoLogicAudit, join(asciiDir, "demo_logic_audit_zh.md"));
  copyFileSync(paths.finalReviewMatrix, join(asciiDir, "final_review_matrix_zh.md"));
  copyFileSync(paths.formCopyVariants, join(asciiDir, "form_copy_variants_zh.txt"));
  copyFileSync(paths.briefPdf, join(asciiDir, "renal_guardian_brief.pdf"));
  copyFileSync(join(submissionDir, "demo_code.zip"), join(asciiDir, "demo_code.zip"));

  mkdirSync(chineseDir, { recursive: true });
  rmSync(join(chineseDir, "作品去背圖檔-腎安守護.png"), { force: true });
  copyFileSync(paths.design1, join(chineseDir, "作品設計圖檔1-腎安守護.jpg"));
  copyFileSync(paths.design2, join(chineseDir, "作品設計圖檔2-腎安守護.jpg"));
  copyFileSync(paths.cutoutJpg, join(chineseDir, "作品去背圖檔-腎安守護.jpg"));
  copyFileSync(paths.cutoutPng, join(chineseDir, "作品去背透明圖-腎安守護.png"));
  copyFileSync(paths.glb, join(chineseDir, "腎安守護-三端式照護系統.glb"));
  copyFileSync(join(submissionDir, "demo_code.zip"), join(chineseDir, "腎安守護-示範程式碼.zip"));
  copyFileSync(paths.checklist, join(chineseDir, "投稿欄位與檔案檢查表.md"));
  copyFileSync(paths.manifest, join(chineseDir, "manifest.txt"));
  copyFileSync(paths.finalStatus, join(chineseDir, "final_submission_status.txt"));
  copyFileSync(paths.repackInstructions, join(chineseDir, "after_signing_repack_instructions.txt"));
  copyFileSync(paths.judgingCopy, join(chineseDir, "judging_copy_zh.txt"));
  copyFileSync(paths.technicalSpec, join(chineseDir, "technical_specification_zh.md"));
  copyFileSync(paths.requirementsTraceability, join(chineseDir, "requirements_traceability_zh.md"));
  copyFileSync(paths.completionAudit, join(chineseDir, "completion_audit_zh.md"));
  copyFileSync(paths.competitionRequirements, join(chineseDir, "competition_requirements_zh.md"));
  copyFileSync(paths.uploadGuide, join(chineseDir, "platform_upload_guide_zh.md"));
  copyFileSync(paths.runtimeVerification, join(chineseDir, "runtime_verification_zh.md"));
  copyFileSync(paths.glbModelAudit, join(chineseDir, "glb_model_audit_zh.md"));
  copyFileSync(paths.demoLogicAudit, join(chineseDir, "demo_logic_audit_zh.md"));
  copyFileSync(paths.finalReviewMatrix, join(chineseDir, "final_review_matrix_zh.md"));
  copyFileSync(paths.formCopyVariants, join(chineseDir, "form_copy_variants_zh.txt"));
  copyFileSync(paths.briefPdf, join(chineseDir, "renal_guardian_brief.pdf"));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function writeChecksums(targetDir, entries) {
  const lines = [
    "SHA-256 checksums for Renal Guardian submission files",
    "Generated by npm run package:submission",
    "",
    ...entries.map((entry) => `${sha256(join(targetDir, entry))}  ${entry}`),
    ""
  ];
  writeFileSync(join(targetDir, "checksums_sha256.txt"), lines.join("\n"));
}

function main() {
  const options = parseArgs();
  if (options.help) {
    printHelp();
    return;
  }

  Object.entries(paths).forEach(([key, value]) => {
    if (key !== "attachment1" && key !== "briefPdf") ensureFile(value, key);
  });
  ensureFile(paths.attachment1, "current attachment 1");

  [
    ["attachment1", paths.attachment1, "--attachment1"],
    ["attachment2", paths.attachment2, "--attachment2"],
    ["attachment3", paths.attachment3, "--attachment3"]
  ].forEach(([optionName, targetPath, flag]) => {
    if (!options[optionName]) return;
    ensureFile(options[optionName], `signed ${optionName}: ${options[optionName]}`);
    if (basename(options[optionName]).toLowerCase().endsWith(".pdf") === false) {
      throw new Error(`${flag} must point to a PDF file`);
    }
    copyFileSync(options[optionName], targetPath);
    console.log(`Replaced ${optionName} with: ${options[optionName]}`);
  });

  rebuildBriefPdf();
  rebuildSigningGuides();
  ensureFile(paths.briefPdf, "brief PDF");
  rebuildCodeBundle();
  copyCommonFiles();
  copyFileSync(paths.attachment1, join(asciiDir, "attachment_1_commitment.pdf"));
  copyFileSync(paths.attachment1, join(chineseDir, "附件一 參賽單位承諾書.pdf"));
  copyFileSync(paths.attachment2, join(chineseDir, "附件二 著作授權同意書.pdf"));
  copyFileSync(paths.attachment3, join(chineseDir, "附件三 蒐集個人資料告知事項暨個人資料提供同意書.pdf"));
  rebuildPlatformUploadFolder();
  rebuildSigningPacket();

  writeChecksums(asciiDir, [
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
    "form_copy_variants_zh.txt"
  ]);

  rmSync(join(submissionDir, "renal_guardian_submission.zip"), { force: true });
  rmSync(join(submissionDir, "腎安守護_投稿包.zip"), { force: true });
  rmSync(join(submissionDir, "platform_upload_files.zip"), { force: true });
  rmSync(join(submissionDir, "signing_packet.zip"), { force: true });
  zipDir("renal_guardian_submission.zip", "renal_guardian_submission");
  zipDir("腎安守護_投稿包.zip", "腎安守護_投稿包");
  zipDir("platform_upload_files.zip", "platform_upload_files");
  zipDir("signing_packet.zip", "signing_packet");

  console.log("Submission packages rebuilt:");
  console.log(" - submission/renal_guardian_submission.zip");
  console.log(" - submission/腎安守護_投稿包.zip");
  console.log(" - submission/platform_upload_files.zip");
  console.log(" - submission/signing_packet.zip");
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
