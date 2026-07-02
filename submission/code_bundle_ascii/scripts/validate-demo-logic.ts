import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mockPatients, patientsWithRisk } from "../src/components/care-demo/mockPatients";
import { calculateRisk } from "../src/components/care-demo/riskEngine";

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

const stableRisk = calculateRisk({
  heartRate: 76,
  spo2: 97,
  activityDropPercent: 0,
  hoursAfterDialysis: 14,
  reportsDizziness: false,
  reportsColdSweat: false,
  bedsideHelpEvent: false
});
expectEqual(stableRisk.score, 0, "stable score");
expectEqual(stableRisk.level, "stable", "stable level");
pass("stable risk scoring");

const weakRisk = calculateRisk({
  heartRate: 58,
  spo2: 95,
  activityDropPercent: 24,
  hoursAfterDialysis: 4,
  reportsDizziness: false,
  reportsColdSweat: false,
  bedsideHelpEvent: false
});
expectEqual(weakRisk.score, 30, "weak recovery score");
expectEqual(weakRisk.level, "stable", "weak recovery level");
if (!weakRisk.reasons.join("，").includes("活動量較透析前下降")) {
  fail("weak recovery should explain activity decline");
}
pass("weak recovery risk scoring");

const emergencyRisk = calculateRisk({
  heartRate: 52,
  spo2: 93,
  activityDropPercent: 31,
  hoursAfterDialysis: 3,
  reportsDizziness: true,
  reportsColdSweat: true,
  bedsideHelpEvent: true
});
expectEqual(emergencyRisk.score, 100, "emergency score clamps at 100");
expectEqual(emergencyRisk.level, "critical", "emergency level");
pass("emergency risk scoring");

const bedCallRisk = calculateRisk({
  heartRate: 72,
  spo2: 96,
  activityDropPercent: 0,
  hoursAfterDialysis: 9,
  reportsDizziness: false,
  reportsColdSweat: false,
  bedsideHelpEvent: true
});
if (bedCallRisk.score < 40) fail("bed call should add at least 40 risk points");
pass("bedside call risk scoring");

const queue = patientsWithRisk(mockPatients);
expectEqual(queue[0].displayId, "A-203", "first queue id");
expectEqual(queue[0].risk.score, 100, "A-203 display score");
expectEqual(queue[0].risk.level, "critical", "A-203 display level");
expectEqual(queue[1].displayId, "A-118", "second queue id");
expectEqual(queue[1].risk.score, 76, "A-118 display score");
expectEqual(queue[1].risk.level, "warning", "A-118 display level");
expectEqual(queue[2].displayId, "A-076", "third queue id");
expectEqual(queue[2].risk.score, 18, "A-076 display score");
expectEqual(queue[2].risk.level, "stable", "A-076 display level");
pass("risk queue mock patients");

[
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
  "src/components/care-demo/mockPatients.ts"
].forEach((file) => {
  const source = readFileSync(resolve(root, file), "utf8");
  if (source.includes("lorem ipsum") || source.includes("placeholder")) fail(`${file} contains placeholder copy`);
  pass(`${file} contains no placeholder copy`);
});

console.log("Demo logic validation passed.");
