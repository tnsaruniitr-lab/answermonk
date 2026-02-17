
import { z } from 'zod';
import { 
  EvalRequestSchema, 
  EvalResponseSchema, 
  AggregateRequestSchema, 
  AggregateResponseSchema,
  analysisResults 
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  eval: {
    run: {
      method: 'POST' as const,
      path: '/api/eval' as const,
      input: EvalRequestSchema,
      responses: {
        200: EvalResponseSchema,
        400: errorSchemas.validation,
      },
    },
  },
  aggregate: {
    run: {
      method: 'POST' as const,
      path: '/api/aggregate' as const,
      input: AggregateRequestSchema,
      responses: {
        200: AggregateResponseSchema,
        400: errorSchemas.validation,
      },
    },
  },
  history: {
    list: {
      method: 'GET' as const,
      path: '/api/history' as const,
      responses: {
        200: z.array(z.custom<typeof analysisResults.$inferSelect>()),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
