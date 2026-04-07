import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

const getCachedSuggestions = unstable_cache(
  async () => {
    const items = await prisma.menuOfDayItem.findMany({
      select: { name: true, price: true, menuOfDay: { select: { date: true } } },
      orderBy: { menuOfDay: { date: 'desc' } },
    });

    // Deduplicate by name — keep the first occurrence (most recent date)
    const seen = new Map<string, number>();
    for (const item of items) {
      if (!seen.has(item.name)) {
        seen.set(item.name, item.price);
      }
    }

    return Array.from(seen.entries())
      .map(([name, price]) => ({ name, price }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  ['menu-suggestions'],
  { revalidate: 300, tags: ['menu-suggestions'] }
);

export async function GET() {
  try {
    const suggestions = await getCachedSuggestions();
    return NextResponse.json({ suggestions });
  } catch (error) {
    logger.error('[GET /api/menu/suggestions]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
