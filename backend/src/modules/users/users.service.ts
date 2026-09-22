import { AppDataSource } from '../../data-source';
import { User } from './entities/user.entity';

const userRepository = () => AppDataSource.getRepository(User);

export async function getProfile(userId: string) {
  return userRepository().findOne({ where: { id: userId } });
}

export async function updateProfile(userId: string, data: { roster_visible?: boolean }) {
  if (data.roster_visible !== undefined) {
    await userRepository().update(userId, { rosterVisible: data.roster_visible });
  }
  return getProfile(userId);
}
