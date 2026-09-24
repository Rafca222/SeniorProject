import { Router } from 'express';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { validateDto } from '../../middleware/validate-dto.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import * as usersService from './users.service';
import { signTokens } from '../auth/auth.service';

const router = Router();

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await usersService.getProfile(req.userId as string);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/me', requireAuth, validateDto(UpdateProfileDto), async (req, res) => {
  try {
    const user = await usersService.updateProfile(req.userId as string, req.body as UpdateProfileDto);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// The role is embedded in the access token (see auth.service.ts), so
// upgrading a user's role needs to issue a FRESH token pair too --
// otherwise their current token would keep saying "user" until it
// naturally expired in 15 minutes, and requireRole checks would keep
// rejecting them even though the database already says "organizer."
router.post('/me/become-organizer', requireAuth, async (req, res) => {
  try {
    const user = await usersService.becomeOrganizer(req.userId as string);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const tokens = signTokens(user.id, user.role, user.tokenVersion);
    res.json({ user, ...tokens });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

export default router;
