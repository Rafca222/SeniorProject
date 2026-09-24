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

// Self-service upgrade: MVP scope has no formal organizer-application
// process, so any regular user can become an organizer directly. Admin
// is deliberately NOT self-assignable here -- that stays a manual,
// direct-database action.
export async function becomeOrganizer(userId: string) {
  const user = await userRepository().findOne({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  if (user.role === 'user') {
    await userRepository().update(userId, { role: 'organizer' });
  }
  return getProfile(userId);
}
