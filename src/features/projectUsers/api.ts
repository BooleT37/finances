import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { generateRandomString } from 'better-auth/crypto';

import { adminMiddleware } from '~/middlewares/adminMiddleware';
import { auth } from '~/server/auth';
import { prisma } from '~/server/db';

import {
  type CreatedProjectUser,
  type CreateProjectUserInput,
  createProjectUserSchema,
  type ProjectUser,
} from './schema';

export const fetchProjectUsers = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async ({ context }): Promise<ProjectUser[]> => {
    const users = await prisma.user.findMany({
      where: { projectId: context.projectId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, role: true },
    });
    return users.map((u) => ({ ...u, role: u.role ?? 'user' }));
  });

export const createProjectUser = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((input: CreateProjectUserInput) =>
    createProjectUserSchema.parse(input),
  )
  .handler(async ({ data, context }): Promise<CreatedProjectUser> => {
    const password = generateRandomString(20, 'a-z', 'A-Z', '0-9');
    const request = getRequest();
    const result = await auth.api.createUser({
      body: {
        email: data.email,
        name: data.name,
        password,
        role: data.role,
        data: { projectId: context.projectId, emailVerified: true },
      },
      headers: request.headers,
    });
    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: data.role,
      password,
    };
  });

export const deleteProjectUser = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: targetUserId, context }) => {
    await prisma.$transaction(async (tx) => {
      const target = await tx.user.findFirst({
        where: { id: targetUserId, projectId: context.projectId },
      });
      if (!target) {
        throw new Error('User not found in this project');
      }
      if (target.role === 'admin') {
        const adminCount = await tx.user.count({
          where: { projectId: context.projectId, role: 'admin' },
        });
        if (adminCount <= 1) {
          throw new Error('Cannot remove the last admin of a project');
        }
      }
    });

    const request = getRequest();
    await auth.api.removeUser({
      body: { userId: targetUserId },
      headers: request.headers,
    });
  });
