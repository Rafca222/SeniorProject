import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../../data-source';
import { User } from './entities/user.entity';

const userRepository = () => AppDataSource.getRepository(User);

export function signTokens(userId: string) {
  const accessToken = jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

export async function findUserByEmail(email: string) {
  return userRepository().findOne({ where: { email } });
}

export async function createUser(data: { name: string; email: string; password: string }) {
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = userRepository().create({ name: data.name, email: data.email, passwordHash });
  await userRepository().save(user);

  // passwordHash is `select:false` on the entity, but .save() still returns
  // the exact in-memory object we built, hash included -- so we strip it
  // by hand before this ever reaches an API response.
  const { passwordHash: _omit, ...safeUser } = user;
  return safeUser;
}

export async function verifyLogin(email: string, password: string) {
  // Explicitly asking for passwordHash here overrides its select:false
  // default -- this is the one place in the app that's allowed to see it.
  const user = await userRepository().findOne({
    where: { email },
    select: ['id', 'name', 'email', 'passwordHash', 'role'],
  });
  if (!user) return null;

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return null;

  const { passwordHash: _omit, ...safeUser } = user;
  return safeUser;
}

export function verifyRefreshToken(refreshToken: string) {
  return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { sub: string }; // throws if invalid/expired
}
