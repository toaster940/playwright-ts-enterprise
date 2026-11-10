import { test, expect } from '../fixtures.js';

test('IndexedDB state capture and restore', async ({ page, browser, baseURL }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('quality-settings', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('settings');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('settings', 'readwrite');
        tx.objectStore('settings').put('dark', 'theme');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
  const state = await page.context().storageState({ indexedDB: true });
  const restored = await browser.newContext({ baseURL, storageState: state });
  try {
    const restoredPage = await restored.newPage();
    await restoredPage.goto('/');
    const theme = await restoredPage.evaluate(
      () =>
        new Promise((resolve, reject) => {
          const request = indexedDB.open('quality-settings', 1);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const value = db.transaction('settings').objectStore('settings').get('theme');
            value.onsuccess = () => {
              db.close();
              resolve(value.result);
            };
          };
        }),
    );
    expect(theme).toBe('dark');
  } finally {
    await restored.close();
  }
});
