import { createServerFn } from '@tanstack/react-start';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import { type Prisma } from '~/generated/prisma/client';
import { prisma } from '~/server/db';
import { adaptCost } from '~/shared/utils/adaptCost';

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

export const fetchAllSubscriptions = createServerFn({ method: 'GET' }).handler(
  async () => {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { name: 'asc' },
      include: { category: true },
    });
    return subscriptions.map(encodeSubscription);
  },
);

// TODO: replace userId with actual user from auth once auth is implemented
export const createSubscription = createServerFn({ method: 'POST' })
  .inputValidator((input: CreateSubscriptionInput) =>
    createSubscriptionSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const user = await prisma.user.findFirstOrThrow();
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
        userId: user.id,
      },
      include: { category: true },
    });
    return encodeSubscription(subscription);
  });

export const updateSubscription = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateSubscriptionInput) =>
    updateSubscriptionSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const { id, ...fields } = data;
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
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await prisma.subscription.delete({ where: { id } });
  });
