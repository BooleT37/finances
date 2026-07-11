import { testPrisma } from './client';
import { seed } from './seed';
import type { SeedData } from './seed';

export async function resetDb(): Promise<SeedData> {
  await testPrisma.expenseComponent.deleteMany();
  await testPrisma.expense.deleteMany();
  await testPrisma.forecast.deleteMany();
  await testPrisma.subscription.deleteMany();
  await testPrisma.savingSpendingCategory.deleteMany();
  await testPrisma.savingSpending.deleteMany();
  await testPrisma.source.deleteMany();
  await testPrisma.subcategory.deleteMany();
  await testPrisma.category.deleteMany();
  await testPrisma.projectSetting.deleteMany();
  await testPrisma.session.deleteMany();
  await testPrisma.account.deleteMany();
  await testPrisma.user.deleteMany();
  await testPrisma.project.deleteMany();
  return seed();
}
