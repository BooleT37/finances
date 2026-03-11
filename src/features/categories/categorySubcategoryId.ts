export type CategorySubcategoryId = `${number}-${number}` | `${number}`;

export function parseCategorySubcategoryId(id: CategorySubcategoryId): {
  categoryId: number;
  subcategoryId: number | null;
} {
  const parts = id.split('-').map((p) => parseInt(p, 10));
  const categoryId = parts[0];
  if (categoryId === undefined || Number.isNaN(categoryId)) {
    throw new Error(`Invalid categorySubcategoryId: ${id}`);
  }
  if (parts.length === 1) {
    return { categoryId, subcategoryId: null };
  }
  const subcategoryId = parts[1];
  if (subcategoryId === undefined || Number.isNaN(subcategoryId)) {
    throw new Error(`Invalid categorySubcategoryId: ${id}`);
  }
  return { categoryId, subcategoryId };
}

export function buildCategorySubcategoryId({
  categoryId,
  subcategoryId,
}: {
  categoryId: number;
  subcategoryId?: number | null;
}): CategorySubcategoryId {
  return subcategoryId != null
    ? `${categoryId}-${subcategoryId}`
    : `${categoryId}`;
}
