Renal Guardian demo code package

Purpose:
This package contains the interactive web demo and basic firmware prototype for the Renal Guardian / 腎安守護 submission.

Run the web demo:
1. Install Node.js dependencies:
   npm install
2. Start local preview:
   npm run dev -- --port 5173
3. Open:
   http://127.0.0.1:5173/

Build check:
   npm run build

Export the 3D model:
   npm run export:glb

Main files:
- src/main.js: Three.js 3D model and interaction logic.
- src/risk.js: health index calculation.
- firmware/renal_guardian_monitor.ino: Arduino-style firmware prototype.
- tools/generate_submission_assets.py: poster and product image generator.
- competition_requirements_zh.md: contest file specs and judging criteria audit.
- platform_upload_guide_zh.md: exact field values and file choices for final platform upload.
- runtime_verification_zh.md: latest build, validation, and browser interaction check record.
- glb_model_audit_zh.md: GLB model node and structure verification.
- demo_logic_audit_zh.md: risk scoring and dispatch scenario verification.
- final_review_matrix_zh.md: final review matrix for contest specs and user requirements.

Runtime browser check:
   npm run validate:runtime

Important behavior:
- The wearable shows time, heart rate, blood pressure, and fall detection.
- The bedside detector shows activity status, SOS/alarm, and bedside call state.
- The office dashboard shows multiple care recipients and dispatch status.
- Fall detection changes the status to immediate assistance and updates the office dashboard.
