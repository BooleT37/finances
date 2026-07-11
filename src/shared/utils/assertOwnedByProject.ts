interface ProjectScopedDelegate {
  findFirst(args: {
    where: { id: number; projectId: string };
  }): Promise<{ id: number } | null>;
}

/**
 * Guard for single-row update/delete calls, which key off `id` alone (Prisma's
 * `where` for update/delete only accepts unique fields, so `projectId` can't be
 * folded into that call directly). Throws if the row doesn't belong to the
 * caller's project, so a foreign id can't be used to read/mutate another
 * project's data.
 */
export async function assertOwnedByProject(
  delegate: ProjectScopedDelegate,
  id: number,
  projectId: string,
  label?: string,
): Promise<void> {
  const row = await delegate.findFirst({ where: { id, projectId } });
  if (!row) {
    throw new Error(`${label ?? 'Record'} with id ${id} not found`);
  }
}
