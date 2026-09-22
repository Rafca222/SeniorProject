import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../../data-source';
import { User } from '../users/entities/user.entity';

const userRepository = () => AppDataSource.getRepository(User);

export class InvalidRefreshTokenError extends Error {}

// role goes in the ACCESS token so requireAuth can authorize requests
// without an extra database lookup on every single request.
// tokenVersion goes in the REFRESH token -- it's what makes rotation work.
export function signTokens(userId: string, role: string, tokenVersion: number) {
  const accessToken = jwt.sign(
    { sub: userId, role },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { sub: userId, tokenVersion },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
}

export async function findUserByEmail(email: string) {
  return userRepository().findOne({ where: { email } });
}

export async function createUser(data: { name: string; email: string; password: string }) {
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = userRepository().create({ name: data.name, email: data.email, passwordHash });
  await userRepository().save(user);

  const { passwordHash: _omit, ...safeUser } = user;
  return safeUser;
}

export async function verifyLogin(email: string, password: string) {
  const user = await userRepository().findOne({
    where: { email },
    select: ['id', 'name', 'email', 'passwordHash', 'role', 'tokenVersion'],
  });
  if (!user) return null;

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return null;

  const { passwordHash: _omit, ...safeUser } = user;
  return safeUser;
}

// Verifies the refresh token AND rotates it: the old token's version is
// immediately superseded, so if that same (old) refresh token is ever
// presented again -- e.g. because it was stolen -- it will no longer match
// and gets rejected below, instead of silently working forever.
export async function rotateRefreshToken(oldRefreshToken: string) {
  let payload: { sub: string; tokenVersion: number };
  try {
    payload = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET as string) as typeof payload;
  } catch {
    throw new InvalidRefreshTokenError('Refresh token is invalid or expired');
  }

  const user = await userRepository().findOne({ where: { id: payload.sub } });
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    // Either the user no longer exists, or this exact refresh token was
    // already used once before -- reject it either way.
    throw new InvalidRefreshTokenError('Refresh token has already been used or is no longer valid');
  }

  const newVersion = user.tokenVersion + 1;
  await userRepository().update(user.id, { tokenVersion: newVersion });

  return signTokens(user.id, user.role, newVersion);
}
