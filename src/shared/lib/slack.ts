import { env } from '@/config/env';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

export async function postChannel(message: string): Promise<void> {
  try {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
  } catch (error) {
    logger.error('[slack] postChannel failed', error);
  }
}

export async function postDM(slackId: string, message: string): Promise<void> {
  try {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({ channel: slackId, text: message }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      logger.error('[slack] postDM rejected', { slackId, error: data.error });
    }
  } catch (error) {
    logger.error('[slack] postDM failed', { slackId, error });
  }
}

export async function getAdminSlackIds(): Promise<string[]> {
  const admins = await prisma.employee.findMany({
    where: { role: 'admin', isActive: true, slackId: { not: null } },
    select: { slackId: true },
  });
  return admins.map((a) => a.slackId!);
}
