import { Router } from 'express';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateBlockDto } from './dto/create-block.dto';
import { validateDto } from '../../middleware/validate-dto.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import * as safetyService from './safety.service';

const router = Router();

router.post('/reports', requireAuth, validateDto(CreateReportDto), async (req, res) => {
  try {
    const report = await safetyService.createReport(req.userId as string, req.body as CreateReportDto);
    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to file report' });
  }
});

router.get('/blocks/me', requireAuth, async (req, res) => {
  try {
    const blockedIds = await safetyService.getBlockedUserIds(req.userId as string);
    res.json({ blockedIds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch blocks' });
  }
});

router.post('/blocks', requireAuth, validateDto(CreateBlockDto), async (req, res) => {
  try {
    const { blocked_id } = req.body as CreateBlockDto;
    await safetyService.createBlock(req.userId as string, blocked_id);
    res.status(201).json({ blocked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

router.delete('/blocks/:blockedId', requireAuth, async (req, res) => {
  try {
    await safetyService.removeBlock(req.userId as string, req.params.blockedId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

export default router;
