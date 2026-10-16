import { z } from 'zod';

/**
 * Zod schema for environment variables (Phase 10 Update).
 * Fails fast at boot if task-critical variables are missing or malformed.
 */
export const envSchema = z.object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required'),

    SITE_URL: z
      .string()
      .min(1, 'SITE_URL is required')
      .url('SITE_URL must be a valid URL (e.g. http://localhost:3000)'),

    UPLOAD_DIR: z
      .string()
      .min(1, 'UPLOAD_DIR is required')
      .default('./uploads'),

    ORDER_LINK_SECRET: z
      .string()
      .min(32, 'ORDER_LINK_SECRET must be at least 32 characters for AES-256-GCM encryption')
      .default('dev-secret-key-32-chars-minimum-length-for-aes-gcm!'),

    OSM_TILE_URL: z
      .string()
      .min(1)
      .default('https://tile.openstreetmap.org/{z}/{x}/{y}.png'),

    PORT: z
      .coerce
      .number()
      .int()
      .positive()
      .default(3000),

    BETTER_AUTH_SECRET: z
      .string()
      .min(16, 'BETTER_AUTH_SECRET must be at least 16 characters')
      .default('development-better-auth-secret-key-32-chars-long!'),

    // Optional instant order notifications to admin messengers (Eitaa, Bale, Telegram)
    EITAA_BOT_TOKEN: z.string().optional(),
    EITAA_CHAT_ID: z.string().optional(),
    BALE_BOT_TOKEN: z.string().optional(),
    BALE_CHAT_ID: z.string().optional(),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_CHAT_ID: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      const isBuild =
        process.env.NEXT_PHASE === 'phase-production-build' ||
        process.env.npm_lifecycle_event === 'build' ||
        process.argv.includes('build');
      if (
        !isBuild &&
        (!data.ORDER_LINK_SECRET ||
          data.ORDER_LINK_SECRET === 'dev-secret-key-32-chars-minimum-length-for-aes-gcm!')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ORDER_LINK_SECRET'],
          message: 'ORDER_LINK_SECRET is required and must not use the development default in production',
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    const errorMessage = `❌ Invalid environment variables:\n${errorDetails}\n\nPlease check your .env or .env.local file.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return result.data;
}

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    const validated = getEnv();
    return validated[prop as keyof Env];
  },
});
