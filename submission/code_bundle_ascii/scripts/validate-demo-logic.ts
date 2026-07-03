import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mockCareCases } from "../src/data/mockCareCases";
import { buildWorkflowViewModel } from "../src/domain/buildWorkflowViewModel";
import { calculateRisk } from "../src/domain/riskScoring";
import type { CareCase, RiskReason } from "../src/domain/careWorkflowTypes";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

function fail(message: string): never {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

function pass(message: string) {
  console.log(`OK ${message}`);
}

function expectEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) fail(`${label}: expected ${expected}, got ${actual}`);
}

function careCase(patientId: string) {
  const found = mockCareCases.find((item) => item.patientId === patientId);
  if (!found) fail(`missing mock case ${patientId}`);
  return found;
}

function hasCategory(reasons: RiskReason[], category: RiskReason["category"]) {
  return reasons.some((reason) => reason.category === category);
}

const a203 = buildWorkflowViewModel(careCase("A-203"));
expectEqual(a203.risk.rawScore, 110, "A-203 raw score");
expectEqual(a203.risk.score, 100, "A-203 final score");
expectEqual(a203.risk.level, "critical", "A-203 level");
expectEqual(a203.risk.confidence, "medium", "A-203 confidence");
expectEqual(a203.risk.dataQuality, "limited", "A-203 dataQuality");
expectEqual(a203.assignment.actionType, "assignedCaregiver", "A-203 action");
expectEqual(a203.assignment.notifyFamily, true, "A-203 family notification");
expectEqual(a203.assignment.notifyCareTeam, true, "A-203 care team notification");
expectEqual(a203.assignment.stateUpdated, true, "A-203 state updated");
["physiological", "activityRecovery", "helpEvent", "dataQuality"].forEach((category) => {
  if (!hasCategory(a203.risk.reasons, category as RiskReason["category"])) fail(`A-203 missing ${category} reason`);
});
expectEqual(
  a203.risk.reasons.filter((reason) => reason.id === "symptom-cluster").length,
  1,
  "A-203 symptom cluster is deduplicated"
);
pass("A-203 critical workflow");

const a118 = buildWorkflowViewModel(careCase("A-118"));
expectEqual(a118.risk.rawScore, 70, "A-118 raw score");
expectEqual(a118.risk.score, 70, "A-118 final score");
expectEqual(a118.risk.level, "warning", "A-118 level");
expectEqual(a118.risk.confidence, "medium", "A-118 confidence");
expectEqual(a118.risk.dataQuality, "limited", "A-118 dataQuality");
expectEqual(a118.assignment.actionType, "followUp30Min", "A-118 action");
if (a118.case.helpEvent?.priority === "urgent") fail("A-118 must not have urgent help event");
pass("A-118 warning workflow");

const a076 = buildWorkflowViewModel(careCase("A-076"));
expectEqual(a076.risk.rawScore, 0, "A-076 raw score");
expectEqual(a076.risk.score, 0, "A-076 final score");
expectEqual(a076.risk.level, "stable", "A-076 level");
expectEqual(a076.risk.confidence, "high", "A-076 confidence");
expectEqual(a076.risk.dataQuality, "good", "A-076 dataQuality");
expectEqual(a076.assignment.actionType, "routineObservation", "A-076 action");
if (a076.activeStages.includes("helpEvent")) fail("A-076 helpEvent should be inactive");
pass("A-076 stable workflow");

const invalidCase: CareCase = {
  patientId: "invalid",
  displayName: "invalid",
  telemetry: {
    hr: null,
    spo2: 140,
    activityDropPercent: null,
    payloadSizeKb: -1,
    signalStatus: "offline",
    lastSyncTime: ""
  }
};
const invalidRisk = calculateRisk(invalidCase);
if (Number.isNaN(invalidRisk.score) || Number.isNaN(invalidRisk.rawScore)) fail("invalid values produced NaN");
expectEqual(invalidRisk.dataQuality, "insufficient", "invalid dataQuality");
expectEqual(invalidRisk.confidence, "low", "invalid confidence");
pass("invalid telemetry validation");

[
  "src/domain/careWorkflowTypes.ts",
  "src/domain/riskScoring.ts",
  "src/domain/buildWorkflowViewModel.ts",
  "src/data/mockCareCases.ts",
  "src/data/wristbandCapabilities.ts",
  "src/components/workflow/CareProcessFlowCanvas.tsx",
  "src/components/dashboard/WorkflowResultPanel.tsx",
  "src/components/dashboard/RiskScoreCard.tsx",
  "src/components/dashboard/RiskReasonList.tsx",
  "src/components/dashboard/WristbandModuleSummary.tsx",
  "src/components/care-demo/CareDemoPage.tsx"
].forEach((file) => {
  const source = readFileSync(resolve(root, file), "utf8");
  if (source.includes("lorem ipsum") || source.includes("placeholder")) fail(`${file} contains placeholder copy`);
  pass(`${file} contains no placeholder copy`);
});

console.log("Demo logic validation passed.");
