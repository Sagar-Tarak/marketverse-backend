import type { IncomingHttpHeaders } from 'node:http';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Identity {
  readonly id: string;
  readonly email: string;
}

/**
 * DEVELOPMENT ONLY. Reads who the caller claims to be from `x-dev-user-id` (a UUID) and the optional
 * `x-dev-user-email`. environment.validation.ts refuses to boot in production until Supabase JWT
 * verification replaces this function.
 */
export function readDevIdentity(
  headers: IncomingHttpHeaders,
): Identity | undefined {
  const rawId = headers['x-dev-user-id'];
  if (typeof rawId !== 'string' || !UUID.test(rawId)) return undefined;

  const id = rawId.toLowerCase();
  const rawEmail = headers['x-dev-user-email'];
  const email =
    typeof rawEmail === 'string' && rawEmail.includes('@')
      ? rawEmail
      : `${id}@dev.local`;
  return { id, email };
}
