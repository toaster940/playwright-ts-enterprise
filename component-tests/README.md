# React component testing

An isolated experimental Playwright React component test project. The newest published component runner is **1.62.1**, independently pinned from the main stable **1.64.1** browser/API project to avoid mixing runner versions in one process.

From the parent project with Node.js 24:

```sh
npm run components:setup
npm run test:components
```

Windows fallback: `.\run.ps1 components:setup` then `.\run.ps1 test:components`.

This installs the component project's own locked dependencies and Chromium binary, then exercises real React mounting, props, event callbacks, updates and unmounting through Vite. Its HTML report is under `../artifacts/component-report`. It is deliberately outside the main runner's discovery and TypeScript configuration.
