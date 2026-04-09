import { prisma } from '@/shared/lib/prisma';

export async function computeBalance(employeeId: string): Promise<number> {
  const result = await prisma.ledgerEntry.aggregate({
    where: { employeeId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function computeFundBalance(): Promise<number> {
  const result = await prisma.ledgerEntry.aggregate({
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}
