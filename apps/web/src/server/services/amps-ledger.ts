import { prisma, type Prisma, type AmpsTransactionType } from '@amplifyworld/database';

type PrismaClientOrTx = typeof prisma | Prisma.TransactionClient;

/**
 * Records one entry in the $AMPS append-only ledger and keeps
 * `User.ampsBalance` in sync — the only place either is ever written, so the
 * balance is always derivable from (and stays consistent with) its
 * transaction history. `amount` is signed: positive to earn, negative to
 * spend. Callers are responsible for checking sufficient balance *before*
 * calling this for a spend (see amps.ts/predictions.ts) — this fictional
 * points ledger has no real-money stakes, so a rare race under concurrent
 * spends is an acceptable simplification, not a integrity risk worth
 * pessimistic locking for.
 */
export async function recordAmpsTransaction(
  client: PrismaClientOrTx,
  params: {
    userId: string;
    type: AmpsTransactionType;
    amount: number;
    description: string;
    metadata?: Record<string, unknown>;
  },
): Promise<{ balanceAfter: number }> {
  const user = await client.user.update({
    where: { id: params.userId },
    data: { ampsBalance: { increment: params.amount } },
  });

  await client.ampsTransaction.create({
    data: {
      userId: params.userId,
      type: params.type,
      amount: params.amount,
      balanceAfter: user.ampsBalance,
      description: params.description,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  return { balanceAfter: user.ampsBalance };
}
