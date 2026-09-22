import { Router } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { validateDto } from '../../middleware/validate-dto.middleware';
import * as authService from './auth.service';

const router = Router();

router.post('/register', validateDto(RegisterDto), async (req, res) => {
  const { name, email, password } = req.body as RegisterDto;

  try {
    const existing = await authService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const user = await authService.createUser({ name, email, password });
    const tokens = authService.signTokens(user.id, user.role, user.tokenVersion);
    res.status(201).json({ user, ...tokens });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', validateDto(LoginDto), async (req, res) => {
  const { email, password } = req.body as LoginDto;

  try {
    const user = await authService.verifyLogin(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const tokens = authService.signTokens(user.id, user.role, user.tokenVersion);
    res.json({ user, ...tokens });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Missing refresh token' });
  }
  try {
    const tokens = await authService.rotateRefreshToken(refreshToken);
    res.json(tokens);
  } catch (err) {
    if (err instanceof authService.InvalidRefreshTokenError) {
      return res.status(401).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

export default router;
