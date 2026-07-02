import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { calculateDialysisRisk } from "../src/risk.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const cases = [
  {
    name: "stable recovery",
    input: { systolicBp: 112, heartRate: 92, activityIndex: 78, fallDetected: false },
    expected: { score: 81, level: "穩定", tone: "stable" }
  },
  {
    name: "watch activity decline",
    input: { systolicBp: 100, heartRate: 92, activityIndex: 60, fallDetected: false },
    expected: { score: 59, level: "觀察", tone: "watch" }
  },
  {
    name: "dispatch threshold",
    input: { systolicBp: 88, heartRate: 118, activityIndex: 45, fallDetected: false },
    expected: { score: 21, level: "派員確認", tone: "warning" }
  },
  {
    name: "critical vital signs",
    input: { systolicBp: 88, heartRate: 118, activityIndex: 20, fallDetected: false },
    expected: { score: 9, level: "立即協助", tone: "critical" }
  },
  {
    name: "fall forces immediate assistance",
    input: { systolicBp: 112, heartRate: 92, activityIndex: 78, fallDetected: true },
    expected: { score: 20, level: "立即協助", tone: "critical" }
  }
];

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`OK ${message}`);
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label}: expected ${expected}, got ${actual}`);
  }
}

cases.forEach((testCase) => {
  const result = calculateDialysisRisk(testCase.input);
  expectEqual(result.score, testCase.expected.score, `${testCase.name} score`);
  expectEqual(result.level, testCase.expected.level, `${testCase.name} level`);
  expectEqual(result.tone, testCase.expected.tone, `${testCase.name} tone`);
  if (!result.message || result.message.length < 12) {
    fail(`${testCase.name} should include a readable action message`);
  }
  pass(`${testCase.name} => ${result.level} / ${result.score}`);
});

const mainSource = readFileSync(resolve(root, "src/main.js"), "utf8");
[
  "wearableScreen",
  "bedsideScreen",
  "officeCurrentRow",
  "officeAlert",
  "床邊通話 OPEN",
  "SOS 求救",
  "立即派員"
].forEach((token) => {
  if (mainSource.includes(token)) pass(`interactive demo includes ${token}`);
  else fail(`interactive demo missing ${token}`);
});

const firmwareSource = readFileSync(resolve(root, "firmware/renal_guardian_monitor.ino"), "utf8");
[
  "calculateHealthIndex",
  "alarmAndOpenCall",
  "dispatchCareWorker",
  "fallDetected",
  "activityIndex"
].forEach((token) => {
  if (firmwareSource.includes(token)) pass(`firmware prototype includes ${token}`);
  else fail(`firmware prototype missing ${token}`);
});

console.log("Demo logic validation passed.");
