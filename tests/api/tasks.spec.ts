import { test, expect } from '../fixtures.js';

test(
  'CRUD lifecycle with schema validation @smoke',
  { tag: '@api', annotation: { type: 'requirement', description: 'TASK-001' } },
  async ({ api }) => {
    const task = await test.step('Create and validate contract', () =>
      api.create('Ship reliable automation'));
    expect(await api.list()).toContainEqual(task);
    expect((await api.complete(task.id)).completed).toBe(true);
    await api.delete(task.id);
    expect(await api.list()).toEqual([]);
  },
);
for (const title of ['', ' '.repeat(5), 'x'.repeat(121)]) {
  test(`reject invalid title (${title.length} characters)`, async ({ api }) => {
    const response = await api.request.post('/api/tasks', { data: { title } });
    expect(response.status()).toBe(422);
    expect(await response.json()).toHaveProperty('error');
  });
}
test('unauthenticated access is rejected', async ({ request }) => {
  expect((await request.get('/api/tasks')).status()).toBe(401);
});
test('unknown task returns 404', async ({ api }) => {
  expect(
    (await api.request.patch('/api/tasks/missing', { data: { completed: true } })).status(),
  ).toBe(404);
});
test('partial updates validate input', async ({ api }) => {
  const task = await api.create('Validate update');
  expect(
    (await api.request.patch(`/api/tasks/${task.id}`, { data: { completed: 'yes' } })).status(),
  ).toBe(422);
  expect((await api.list())[0]?.completed).toBe(false);
});
test('parallel requests and eventual assertions', async ({ api }) => {
  await Promise.all(['One', 'Two', 'Three'].map((title) => api.create(title)));
  await expect.poll(async () => (await api.list()).length).toBe(3);
});
test('request contexts isolate cookies and tenant data', async ({
  playwright,
  baseURL,
  api,
  namespace,
}) => {
  await api.create('Private task');
  const other = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { 'x-test-namespace': `${namespace}-other` },
  });
  try {
    expect((await other.get('/api/me')).status()).toBe(401);
    await other.post('/api/login', {
      data: { email: 'qa@example.com', password: 'Playwright123!' },
    });
    expect(await (await other.get('/api/tasks')).json()).toEqual([]);
    await other.delete('/api/namespace');
  } finally {
    await other.dispose();
  }
});
test('new request cookie management APIs', async ({ request, baseURL }) => {
  await request.addCookies([{ name: 'example', value: '42', url: baseURL! }]);
  expect((await request.cookies()).some((cookie) => cookie.name === 'example')).toBe(true);
  await request.clearCookies({ name: 'example' });
  expect((await request.cookies()).some((cookie) => cookie.name === 'example')).toBe(false);
});
test('invalid JSON is a client error', async ({ api }) => {
  const response = await api.request.post('/api/tasks', {
    data: '{invalid',
    headers: { 'content-type': 'application/json' },
  });
  expect(response.status()).toBe(400);
});
