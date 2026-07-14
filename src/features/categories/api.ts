import { createServerFn } from '@tanstack/react-start';

import { authMiddleware } from '~/middlewares/authMiddleware';
import { prisma } from '~/server/db';
import { assertOwnedByProject } from '~/shared/utils/assertOwnedByProject';

import {
  categorySchema,
  type CreateCategoryInput,
  createCategorySchema,
  type UpdateCategoryInput,
  type UpdateCategoryOrderInput,
  updateCategoryOrderSchema,
  updateCategorySchema,
} from './schema';

export const fetchAllCategories = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const categories = await prisma.category.findMany({
      where: { projectId: context.projectId },
      orderBy: { name: 'asc' },
      include: { subcategories: { orderBy: { id: 'asc' } } },
    });
    return categories.map((c) => categorySchema.encode(c));
  });

export const createCategory = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((input: CreateCategoryInput) =>
    createCategorySchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        shortname: data.shortname,
        icon: data.icon,
        isIncome: data.isIncome,
        isContinuous: data.isContinuous,
        projectId: context.projectId,
        subcategories: {
          createMany: {
            data: data.subcategories.map((s) => ({ name: s.name })),
          },
        },
      },
      include: { subcategories: { orderBy: { id: 'asc' } } },
    });

    const settings = await prisma.projectSetting.findFirst({
      where: { projectId: context.projectId },
    });
    if (settings) {
      const orderField = data.isIncome
        ? 'incomeCategoriesOrder'
        : 'expenseCategoriesOrder';
      const currentOrder = data.isIncome
        ? settings.incomeCategoriesOrder
        : settings.expenseCategoriesOrder;
      await prisma.projectSetting.update({
        where: { projectId: context.projectId },
        data: { [orderField]: [...currentOrder, category.id] },
      });
    }

    return categorySchema.encode(category);
  });

export const updateCategory = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((input: UpdateCategoryInput) =>
    updateCategorySchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, subcategories, ...fields } = data;

    await assertOwnedByProject(
      prisma.category,
      id,
      context.projectId,
      'Category',
    );

    // Subcategory has no projectId of its own — ownership is transitive via
    // categoryId, so verify every referenced id actually belongs to this
    // (already project-verified) category. Without this, the upsert below
    // would happily update a subcategory belonging to a different category
    // (and thus potentially a different project) by id alone.
    const ownedSubcategoryIds = new Set(
      (
        await prisma.subcategory.findMany({
          where: { categoryId: id },
          select: { id: true },
        })
      ).map((s) => s.id),
    );

    const existingIds = subcategories
      .filter((s) => s.id !== undefined)
      .map((s) => s.id as number);

    for (const subcategoryId of existingIds) {
      if (!ownedSubcategoryIds.has(subcategoryId)) {
        throw new Error(
          `Subcategory with id ${subcategoryId} not found in category with id ${id}`,
        );
      }
    }

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
  .middleware([authMiddleware])
  .inputValidator((input: UpdateCategoryOrderInput) =>
    updateCategoryOrderSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const orderField = data.isIncome
      ? 'incomeCategoriesOrder'
      : 'expenseCategoriesOrder';
    await prisma.projectSetting.upsert({
      where: { projectId: context.projectId },
      create: { projectId: context.projectId, [orderField]: data.categoryIds },
      update: { [orderField]: data.categoryIds },
    });
  });

export const deleteCategory = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((id: number) => id)
  .handler(async ({ data: id, context }) => {
    await assertOwnedByProject(
      prisma.category,
      id,
      context.projectId,
      'Category',
    );

    await prisma.$transaction(async (tx) => {
      const category = await tx.category.findUniqueOrThrow({ where: { id } });

      // Delete subcategories first (categoryId is nullable — no cascade)
      await tx.subcategory.deleteMany({ where: { categoryId: id } });

      // Delete the category — will throw if expenses/forecasts/subscriptions exist
      await tx.category.delete({ where: { id } });

      // Remove from the order array
      const settings = await tx.projectSetting.findFirst({
        where: { projectId: context.projectId },
      });
      if (settings) {
        const orderField = category.isIncome
          ? 'incomeCategoriesOrder'
          : 'expenseCategoriesOrder';
        const currentOrder = category.isIncome
          ? settings.incomeCategoriesOrder
          : settings.expenseCategoriesOrder;
        await tx.projectSetting.update({
          where: { projectId: context.projectId },
          data: {
            [orderField]: currentOrder.filter((cId: number) => cId !== id),
          },
        });
      }
    });
  });
