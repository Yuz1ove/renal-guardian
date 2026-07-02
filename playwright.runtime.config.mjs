export default {
  testDir: ".",
  testMatch: "scripts/validate-runtime.spec.mjs",
  testIgnore: "submission/**",
  reporter: "line",
  workers: 1,
  use: {
    headless: true
  }
};
