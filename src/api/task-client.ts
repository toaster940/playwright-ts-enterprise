import { expect, type APIRequestContext } from '@playwright/test';
import { z } from 'zod';

export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  completed: z.boolean(),
});
export type Task = z.infer<typeof taskSchema>;
export class TaskClient {
  constructor(readonly request: APIRequestContext) {}
  async list(): Promise<Task[]> {
    const response = await this.request.get('/api/tasks');
    await expect(response).toBeOK();
    return taskSchema.array().parse(await response.json());
  }
  async create(title: string): Promise<Task> {
    const response = await this.request.post('/api/tasks', { data: { title } });
    expect(response.status()).toBe(201);
    return taskSchema.parse(await response.json());
  }
  async complete(id: string): Promise<Task> {
    const response = await this.request.patch(`/api/tasks/${id}`, { data: { completed: true } });
    await expect(response).toBeOK();
    return taskSchema.parse(await response.json());
  }
  async delete(id: string): Promise<void> {
    expect((await this.request.delete(`/api/tasks/${id}`)).status()).toBe(204);
  }
}
