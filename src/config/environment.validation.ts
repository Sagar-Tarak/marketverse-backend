type Environment = Record<string, string | undefined>;

const nodeEnvironments = new Set(['development', 'test', 'production']);

/** Fails at boot, not at first use. Add every new env var here and to `.env.example`. */
export function validateEnvironment(environment: Environment): Environment {
  const port = environment.PORT ?? '3000';

  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  if (
    environment.NODE_ENV !== undefined &&
    !nodeEnvironments.has(environment.NODE_ENV)
  ) {
    throw new Error('NODE_ENV must be development, test, or production.');
  }

  // Auth is the development-only header identity until Supabase JWT verification exists
  // (modules/identity/functions/dev-auth.functions.ts). It must never run in production.
  if (environment.NODE_ENV === 'production') {
    throw new Error(
      'Production auth (Supabase) is not implemented yet: refusing to start with development auth.',
    );
  }

  if (!/^postgres(ql)?:\/\//.test(environment.DATABASE_URL ?? '')) {
    throw new Error('DATABASE_URL must be a postgresql:// connection string.');
  }

  if (
    environment.REDIS_URL !== undefined &&
    !/^rediss?:\/\//.test(environment.REDIS_URL)
  ) {
    throw new Error('REDIS_URL must be a redis:// connection string.');
  }

  return { ...environment, PORT: port };
}
