import { AppDataSource } from '../../data-source';
import { Report } from './entities/report.entity';
import { Block } from './entities/block.entity';

const reportRepository = () => AppDataSource.getRepository(Report);
const blockRepository = () => AppDataSource.getRepository(Block);

export async function createReport(
  reporterId: string,
  data: { reported_user_id: string; event_id?: string; reason: string }
) {
  const report = reportRepository().create({
    reporterId,
    reportedUserId: data.reported_user_id,
    eventId: data.event_id,
    reason: data.reason,
  });
  return reportRepository().save(report);
}

export async function createBlock(blockerId: string, blockedId: string) {
  // save() upserts on the composite primary key -- blocking someone twice
  // is a harmless no-op rather than a duplicate-key error.
  await blockRepository().save({ blockerId, blockedId });
}

export async function removeBlock(blockerId: string, blockedId: string) {
  await blockRepository().delete({ blockerId, blockedId });
}

// The set of user IDs the given user has chosen to block -- used to filter
// that user's own view of chat history and rosters. This is deliberately
// one-directional: A blocking B hides B's messages from A, but doesn't
// hide A's messages from B (matching how blocking works on most platforms).
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const rows = await blockRepository().find({ where: { blockerId: userId } });
  return rows.map((r) => r.blockedId);
}
