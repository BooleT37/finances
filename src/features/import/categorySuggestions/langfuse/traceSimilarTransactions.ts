import { startActiveObservation } from '@langfuse/tracing';

import type { Subscription } from '~/generated/prisma/client';

import type { CategoryJevCriterion } from '../categoryJevCriteria';
import {
  describeSimilarTransaction,
  type SimilarTransaction,
} from '../categoryJevQuestion';

export const traceSimilarTransactions = (
  {
    description,
    sourceId,
    isIncome,
    criteria,
    subscriptions,
  }: {
    description: string;
    sourceId: number;
    isIncome: boolean;
    criteria: CategoryJevCriterion[];
    subscriptions: Subscription[];
  },
  find: () => Promise<SimilarTransaction[]>,
) =>
  startActiveObservation(
    'find-similar-transactions',
    async (retriever) => {
      retriever.update({ input: { description, sourceId, isIncome } });
      const similarTransactions = await find();
      retriever.update({
        output: similarTransactions.map(({ transaction, similarity }) => ({
          similarity,
          ...describeSimilarTransaction(transaction, criteria, subscriptions),
        })),
      });
      return similarTransactions;
    },
    { asType: 'retriever' },
  );
