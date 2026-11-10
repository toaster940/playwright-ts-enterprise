import express, { type ErrorRequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { env } from '../config/env.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));
type Task = { id: string; title: string; completed: boolean };
const tasks = new Map<string, Task[]>();
const sessions = new Set<string>();
const input = z.object({ title: z.string().trim().min(1).max(120) });
const cookie = (header: string | undefined) => header?.match(/(?:^|;\s*)session=([^;]+)/)?.[1];
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.post('/api/login', (req, res) => {
  if (req.body.email !== 'qa@example.com' || req.body.password !== 'Playwright123!') {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const session = randomUUID();
  sessions.add(session);
  res
    .cookie('session', session, { httpOnly: true, sameSite: 'strict' })
    .json({ user: 'QA Engineer' });
});
app.get('/api/me', (req, res) => {
  if (!sessions.has(cookie(req.headers.cookie) ?? '')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({ name: 'QA Engineer', email: 'qa@example.com' });
});
app.use('/api/tasks', (req, res, next) => {
  const namespace = req.header('x-test-namespace');
  if (!namespace || !/^[a-zA-Z0-9-]{1,100}$/.test(namespace)) {
    res.status(400).json({ error: 'Valid x-test-namespace required' });
    return;
  }
  if (!sessions.has(cookie(req.headers.cookie) ?? '')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (!tasks.has(namespace)) tasks.set(namespace, []);
  res.locals.items = tasks.get(namespace);
  next();
});
app.get('/api/tasks', (_req, res) => res.json(res.locals.items));
app.post('/api/tasks', (req, res) => {
  const parsed = input.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: 'Title must contain 1–120 characters' });
    return;
  }
  const task = { id: randomUUID(), title: parsed.data.title, completed: false };
  (res.locals.items as Task[]).push(task);
  res.status(201).json(task);
});
app.patch('/api/tasks/:id', (req, res) => {
  const parsed = z.object({ completed: z.boolean() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: 'completed must be boolean' });
    return;
  }
  const task = (res.locals.items as Task[]).find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  task.completed = parsed.data.completed;
  res.json(task);
});
app.delete('/api/tasks/:id', (req, res) => {
  const items = res.locals.items as Task[];
  const index = items.findIndex((t) => t.id === req.params.id);
  if (index < 0) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  items.splice(index, 1);
  res.sendStatus(204);
});
app.delete('/api/namespace', (req, res) => {
  if (!sessions.has(cookie(req.headers.cookie) ?? '')) {
    res.sendStatus(401);
    return;
  }
  tasks.delete(req.header('x-test-namespace') ?? '');
  res.sendStatus(204);
});
app.get('/api/catalog', (_req, res) => res.json([{ id: 1, name: 'Playwright course' }]));
app.get('/api/export', (_req, res) =>
  res.attachment('tasks.csv').type('csv').send('title,completed\nLearn Playwright,false\n'),
);
app.use(express.static(fileURLToPath(new URL('./public/', import.meta.url))));
const errors: ErrorRequestHandler = (error, _req, res, _next) => {
  res
    .status(error instanceof SyntaxError ? 400 : 500)
    .json({ error: error instanceof SyntaxError ? 'Invalid JSON' : 'Internal server error' });
};
app.use(errors);
const server = app.listen(env.PORT, '127.0.0.1', () =>
  console.log(`Demo app: http://127.0.0.1:${env.PORT}`),
);
for (const signal of ['SIGTERM', 'SIGINT'] as const)
  process.on(signal, () => server.close(() => process.exit(0)));
