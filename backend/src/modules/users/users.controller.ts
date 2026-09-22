import { Router } from 'express';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { validateDto } from '../../middleware/validate-dto.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import * as usersService from './users.service';

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

export default router;
