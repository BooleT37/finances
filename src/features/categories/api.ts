import { createServerFn } from '@tanstack/react-start';

import { prisma } from '~/server/db';

import {
  categorySchema,
  type CreateCategoryInput,
  createCategorySchema,
  type UpdateCategoryInput,
  type UpdateCategoryOrderInput,
  updateCategoryOrderSchema,
  updateCategorySchema,
} from './schema';

export const fetchAllCategories = createServerFn({ method: 'GET' }).handler(
  async () => {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { subcategories: { orderBy: { id: 'asc' } } },
    });
    return categories.map((c) => categorySchema.encode(c));
  },
);

// TODO: replace userId with actual user from auth once auth is implemented
export const createCategory = createServerFn({ method: 'POST' })
  .inputValidator((input: CreateCategoryInput) =>
    createCategorySchema.parse(input),
  )
  .handler(async ({ data }) => {
    const user = await prisma.user.findFirstOrThrow();

    const category = await prisma.category.create({
      data: {
        name: data.name,
        shortname: data.shortname,
        icon: data.icon,
        isIncome: data.isIncome,
        isContinuous: data.isContinuous,
        userId: user.id,
        subcategories: {
          createMany: {
            data: data.subcategories.map((s) => ({ name: s.name })),
          },
        },
      },
      include: { subcategories: { orderBy: { id: 'asc' } } },
    });

    const settings = await prisma.userSetting.findFirst({
      where: { userId: user.id },
    });
    if (settings) {
      const orderField = data.isIncome
        ? 'incomeCategoriesOrder'
        : 'expenseCategoriesOrder';
      const currentOrder = data.isIncome
        ? settings.incomeCategoriesOrder
        : settings.expenseCategoriesOrder;
      await prisma.userSetting.update({
        where: { userId: user.id },
        data: { [orderField]: [...currentOrder, category.id] },
      });
    }

    return categorySchema.encode(category);
  });

export const updateCategory = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateCategoryInput) =>
    updateCategorySchema.parse(input),
  )
  .handler(async ({ data }) => {
    const { id, subcategories, ...fields } = data;

    const existingIds = subcategories
      .filter((s) => s.id !== undefined)
      .map((s) => s.id as number);

    await prisma.$transaction(async (tx) => {
      // Delete subcategories removed from the list
      await tx.subcategory.deleteMany({
        where: { categoryId: id, id: { notIn: existingIds } },
      });

      // Upsert: update existing (by id) or create new (id=0 never matches → create)
      for (const s of subcategories) {
        await tx.subcategory.upsert({
          where: { id: s.id ?? 0 },
          update: { name: s.name },
          create: { name: s.name, categoryId: id },
        });
      }

      // Update category fields (isIncome is intentionally excluded from updateCategorySchema)
      await tx.category.update({ where: { id }, data: fields });
    });

    const updated = await prisma.category.findUniqueOrThrow({
      where: { id },
      include: { subcategories: { orderBy: { id: 'asc' } } },
    });

    return categorySchema.encode(updated);
  });

export const updateCategoryOrder = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateCategoryOrderInput) =>
    updateCategoryOrderSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const user = await prisma.user.findFirstOrThrow();
    const orderField = data.isIncome
      ? 'incomeCategoriesOrder'
      : 'expenseCategoriesOrder';
    await prisma.userSetting.upsert({
      where: { userId: user.id },
      create: { userId: user.id, [orderField]: data.categoryIds },
      update: { [orderField]: data.categoryIds },
    });
  });

export const deleteCategory = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await prisma.$transaction(async (tx) => {
      const category = await tx.category.findUniqueOrThrow({ where: { id } });

      // Delete subcategories first (categoryId is nullable — no cascade)
      await tx.subcategory.deleteMany({ where: { categoryId: id } });

      // Delete the category — will throw if expenses/forecasts/subscriptions exist
      await tx.category.delete({ where: { id } });

      // Remove from the order array
      const user = await tx.user.findFirstOrThrow();
      const settings = await tx.userSetting.findFirst({
        where: { userId: user.id },
      });
      if (settings) {
        const orderField = category.isIncome
          ? 'incomeCategoriesOrder'
          : 'expenseCategoriesOrder';
        const currentOrder = category.isIncome
          ? settings.incomeCategoriesOrder
          : settings.expenseCategoriesOrder;
        await tx.userSetting.update({
          where: { userId: user.id },
          data: {
            [orderField]: currentOrder.filter((cId: number) => cId !== id),
          },
        });
      }
    });
  });
