import { beforeEach, describe, expect, it, vi } from 'vitest';

import { suggestCategoriesForProject } from './suggestCategories';

const mocks = vi.hoisted(() => ({
  findProjectSetting: vi.fn(),
  findCategories: vi.fn(),
  askChoice: vi.fn(),
}));

vi.mock('~/server/db', () => ({
  prisma: {
    projectSetting: { findUniqueOrThrow: mocks.findProjectSetting },
    category: { findMany: mocks.findCategories },
  },
}));
vi.mock('~/server/typesafe', () => ({
  typesafe: { askChoice: mocks.askChoice },
}));

const request = { sourceId: 1, subscriptionIds: [], importedTransactions: [] };
const context = { userId: 'user-1', projectId: 'project-1' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('suggestCategoriesForProject', () => {
  it('refuses and contacts nothing when category autofill is off', async () => {
    mocks.findProjectSetting.mockResolvedValue({
      categorySuggestionsEnabledAt: null,
    });

    await expect(suggestCategoriesForProject(request, context)).rejects.toThrow(
      'Category autofill is turned off for this project',
    );
    expect(mocks.findProjectSetting).toHaveBeenCalledWith({
      where: { projectId: 'project-1' },
      select: { categorySuggestionsEnabledAt: true },
    });
    expect(mocks.findCategories).not.toHaveBeenCalled();
    expect(mocks.askChoice).not.toHaveBeenCalled();
  });
});
