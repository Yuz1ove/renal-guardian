/*
  腎安守護 Renal Guardian
  Basic prototype logic for post-dialysis home recovery monitoring.

  Sensors can be replaced by real modules:
  - blood pressure module
  - heart-rate / SpO2 sensor
  - activity sensor near the bed
  - fall detection sensor
  - office dashboard / caregiver dispatch endpoint
*/

const int LED_GREEN = 5;
const int LED_YELLOW = 6;
const int LED_RED = 7;
const int BUZZER = 9;

struct PatientState {
  int systolicBp;
  int heartRate;
  int activityIndex;
  bool fallDetected;
};

int calculateHealthIndex(PatientState state) {
  int bpRisk = 8;
  if (state.systolicBp < 90) bpRisk = 35;
  else if (state.systolicBp < 105) bpRisk = 22;
  else if (state.systolicBp > 165) bpRisk = 20;

  int heartRisk = 7;
  if (state.heartRate > 115) heartRisk = 24;
  else if (state.heartRate > 100) heartRisk = 16;
  else if (state.heartRate < 55) heartRisk = 18;

  int activityRisk = 4;
  if (state.activityIndex < 35) activityRisk = 32;
  else if (state.activityIndex < 55) activityRisk = 20;
  else if (state.activityIndex < 70) activityRisk = 12;

  int fallRisk = state.fallDetected ? 36 : 0;
  int risk = min(100, bpRisk + heartRisk + activityRisk + fallRisk);
  return max(0, 100 - risk);
}

void showHealthIndex(int healthIndex, bool fallDetected) {
  digitalWrite(LED_GREEN, healthIndex > 65 && !fallDetected);
  digitalWrite(LED_YELLOW, healthIndex <= 65 && healthIndex > 40 && !fallDetected);
  digitalWrite(LED_RED, healthIndex <= 40 || fallDetected);

  if (fallDetected || healthIndex <= 20) {
    tone(BUZZER, 1200, 500);
    alarmAndOpenCall();
    dispatchCareWorker();
  } else if (healthIndex <= 40) {
    tone(BUZZER, 900, 250);
    dispatchCareWorker();
  } else {
    noTone(BUZZER);
  }
}

void dispatchCareWorker() {
  Serial.println("Office dashboard: dispatch care worker now.");
}

void alarmAndOpenCall() {
  Serial.println("Bedside detector: alarm, open two-way call.");
}

PatientState readPatientState() {
  // Replace these sample values with real sensor reads.
  PatientState state;
  state.systolicBp = 98;
  state.heartRate = 106;
  state.activityIndex = 42;
  state.fallDetected = false;
  return state;
}

void setup() {
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  PatientState state = readPatientState();
  int healthIndex = calculateHealthIndex(state);
  Serial.print("Renal Guardian health index: ");
  Serial.println(healthIndex);
  showHealthIndex(healthIndex, state.fallDetected);
  delay(5000);
}
