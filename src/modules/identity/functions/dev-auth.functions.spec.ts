import { describe, expect, it } from 'vitest';
import { readDevIdentity } from './dev-auth.functions.js';

const ID = '0b9c6b1e-4f35-4c53-9a58-3f2d1c0e7a11';

describe('readDevIdentity', () => {
  it('reads the user id and defaults the email', () => {
    expect(readDevIdentity({ 'x-dev-user-id': ID })).toEqual({
      id: ID,
      email: `${ID}@dev.local`,
    });
  });

  it('uses a given email and lower-cases the id', () => {
    expect(
      readDevIdentity({
        'x-dev-user-id': ID.toUpperCase(),
        'x-dev-user-email': 'ana@example.com',
      }),
    ).toEqual({ id: ID, email: 'ana@example.com' });
  });

  it('rejects a missing, malformed or repeated id header', () => {
    expect(readDevIdentity({})).toBeUndefined();
    expect(readDevIdentity({ 'x-dev-user-id': 'not-a-uuid' })).toBeUndefined();
    expect(readDevIdentity({ 'x-dev-user-id': [ID, ID] })).toBeUndefined();
  });
});
