import 'dotenv/config';
import { z } from 'zod';

export const env = z
  .object({
    PORT: z.coerce.number().int().min(1024).max(65535).default(4173),
    BASE_URL: z.string().url().default('http://127.0.0.1:4173'),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default('gpt-6.1-sol'),
    AGENT_MAX_STEPS: z.coerce.number().int().min(1).max(20).default(8),
  })
  .parse(process.env);
