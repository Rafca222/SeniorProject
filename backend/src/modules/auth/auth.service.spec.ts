import jwt from 'jsonwebtoken';

process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

// Imported after the env vars above are set, since signTokens reads them
// at call time -- this file never touches the database (no
// AppDataSource.initialize() call), so it's a genuine unit test.
import { signTokens } from './auth.service';

describe('signTokens', () => {
  it('produces an access token carrying the user id and role', () => {
    const { accessToken } = signTokens('user-123', 'organizer', 0);
    const payload = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET as string) as any;

    expect(payload.sub).toBe('user-123');
    expect(payload.role).toBe('organizer');
  });

  it('produces a refresh token carrying the id and token version', () => {
    const { refreshToken } = signTokens('user-123', 'user', 4);
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;

    expect(payload.sub).toBe('user-123');
    expect(payload.tokenVersion).toBe(4);
  });

  it('rejects an access token signed with the wrong secret (tampering check)', () => {
    const { accessToken } = signTokens('user-123', 'user', 0);
    expect(() => jwt.verify(accessToken, 'a-completely-different-secret')).toThrow();
  });

  it('does not embed the role in the refresh token', () => {
    // The refresh token is deliberately minimal (sub + tokenVersion only)
    // -- role lives on the access token, since refresh tokens are
    // long-lived and shouldn't carry authorization data that could go
    // stale before the token itself expires.
    const { refreshToken } = signTokens('user-123', 'admin', 0);
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;
    expect(payload.role).toBeUndefined();
  });
});
