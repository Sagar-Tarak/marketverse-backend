import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './environment.validation.js';

const valid = { DATABASE_URL: 'postgresql://u:p@localhost:5432/db' };

describe('validateEnvironment', () => {
  it('accepts a minimal environment and defaults PORT', () => {
    expect(validateEnvironment(valid)).toMatchObject({ PORT: '3000' });
  });

  it('requires a postgres DATABASE_URL', () => {
    expect(() => validateEnvironment({})).toThrow('DATABASE_URL');
    expect(() => validateEnvironment({ DATABASE_URL: 'mysql://x' })).toThrow(
      'DATABASE_URL',
    );
  });

  it('rejects a bad PORT, NODE_ENV and REDIS_URL', () => {
    expect(() => validateEnvironment({ ...valid, PORT: '70000' })).toThrow(
      'PORT',
    );
    expect(() => validateEnvironment({ ...valid, NODE_ENV: 'prod' })).toThrow(
      'NODE_ENV',
    );
    expect(() =>
      validateEnvironment({ ...valid, REDIS_URL: 'localhost:6379' }),
    ).toThrow('REDIS_URL');
  });

  it('refuses to start in production while auth is development-only', () => {
    expect(() =>
      validateEnvironment({ ...valid, NODE_ENV: 'production' }),
    ).toThrow('Production auth');
  });

  it('accepts a redis URL', () => {
    expect(() =>
      validateEnvironment({ ...valid, REDIS_URL: 'redis://localhost:6379' }),
    ).not.toThrow();
  });
});
