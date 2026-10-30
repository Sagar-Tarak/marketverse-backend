/**
 * Typed application config, loaded once by ConfigModule (`load: [configuration]`).
 * Read it with `ConfigService<AppConfig, true>`: `config.get('database.url', { infer: true })`.
 * Raw env names are validated in environment.validation.ts; only this file turns them into config.
 */
export interface AppConfig {
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly port: number;
  readonly database: { readonly url: string };
  readonly redis: { readonly url: string | undefined };
}

export function configuration(): AppConfig {
  const { NODE_ENV, PORT, DATABASE_URL, REDIS_URL } = process.env;
  return {
    nodeEnv: (NODE_ENV as AppConfig['nodeEnv'] | undefined) ?? 'development',
    port: Number(PORT ?? 3000),
    database: { url: DATABASE_URL ?? '' },
    redis: { url: REDIS_URL },
  };
}
