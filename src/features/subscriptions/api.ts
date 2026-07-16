import { createServerFn } from '@tanstack/react-start';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import { type Prisma } from '~/generated/prisma/client';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { prisma } from '~/server/db';
import { adaptCost } from '~/shared/utils/adaptCost';
import { assertOwnedByProject } from '~/shared/utils/assertOwnedByProject';

import {
  type CreateSubscriptionInput,
  createSubscriptionSchema,
  subscriptionSchema,
  type UpdateSubscriptionInput,
  updateSubscriptionSchema,
} from './schema';

type SubscriptionWithCategory = Prisma.SubscriptionGetPayload<{
  include: { category: true };
}>;

function encodeSubscription(s: SubscriptionWithCategory) {
  return subscriptionSchema.encode({
    ...s,
    cost: adaptCost(s.cost, s.category.isIncome),
    firstDate: dayjs(s.firstDate),
  });
}

export const fetchAllSubscriptions = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const subscriptions = await prisma.subscription.findMany({
      where: { projectId: context.projectId },
      orderBy: { name: 'asc' },
      include: { category: true },
    });
    return subscriptions.map(encodeSubscription);
  });

export const createSubscription = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((input: CreateSubscriptionInput) =>
    createSubscriptionSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const subscription = await prisma.subscription.create({
      data: {
        name: data.name,
        cost: new Decimal(data.cost).abs(),
        period: data.period,
        firstDate: new Date(data.firstDate),
        active: data.active,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        sourceId: data.sourceId,
        projectId: context.projectId,
      },
      include: { category: true },
    });
    return encodeSubscription(subscription);
  });

export const updateSubscription = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((input: UpdateSubscriptionInput) =>
    updateSubscriptionSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    await assertOwnedByProject(
      prisma.subscription,
      id,
      context.projectId,
      'Subscription',
    );
    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        name: fields.name,
        cost: new Decimal(fields.cost).abs(),
        period: fields.period,
        firstDate: new Date(fields.firstDate),
        active: fields.active,
        categoryId: fields.categoryId,
        subcategoryId: fields.subcategoryId,
        sourceId: fields.sourceId,
      },
      include: { category: true },
    });
    return encodeSubscription(subscription);
  });

export const deleteSubscription = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((id: number) => id)
  .handler(async ({ data: id, context }) => {
    await assertOwnedByProject(
      prisma.subscription,
      id,
      context.projectId,
      'Subscription',
    );

    await prisma.$transaction(async (tx) => {
      // Composite FK (subscriptionId, projectId) can't use onDelete: SetNull —
      // projectId is required, so the DB can't null just one column. Null
      // subscriptionId out explicitly before deleting the subscription.
      await tx.expense.updateMany({
        where: { subscriptionId: id, projectId: context.projectId },
        data: { subscriptionId: null },
      });
      await tx.subscription.delete({ where: { id } });
    });
  });
