import process from 'node:process';
const reportDir = process.env.BDD_REPORT_DIR ?? 'artifacts/cucumber';
const shared = {
  paths: ['features/**/*.feature'],
  import: ['cucumber/support/hooks.ts', 'cucumber/steps/**/*.ts'],
  parallel: 2,
  retry: 0,
  strict: true,
  publish: false,
  format: [
    'progress',
    ['html', `${reportDir}/report.html`],
    ['json', `${reportDir}/results.json`],
    ['junit', `${reportDir}/junit.xml`],
    ['message', `${reportDir}/messages.ndjson`],
  ],
  worldParameters: { browser: 'chromium', headless: true },
};
export default shared;
export const smoke = { ...shared, tags: '@smoke' };
export const api = { ...shared, tags: '@api and not @ui' };
export const ui = { ...shared, tags: '@ui' };
export const firefox = { ...shared, worldParameters: { browser: 'firefox', headless: true } };
export const webkit = { ...shared, worldParameters: { browser: 'webkit', headless: true } };
export const headed = {
  ...shared,
  parallel: 1,
  worldParameters: { browser: 'chromium', headless: false },
};
