import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

import { adminMiddleware } from '~/middlewares/adminMiddleware';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { auth } from '~/server/auth';
import { prisma } from '~/server/db';

import {
  type CreateProjectUserInput,
  createProjectUserSchema,
  type ProjectUser,
  type ResetProjectUserPasswordInput,
  resetProjectUserPasswordSchema,
} from './schema';

export const fetchProjectUsers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
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
  .handler(async ({ data, context }) => {
    const request = getRequest();
    const result = await auth.api.createUser({
      body: {
        email: data.email,
        name: data.name,
        password: data.password,
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
    };
  });

export const resetProjectUserPassword = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((input: ResetProjectUserPasswordInput) =>
    resetProjectUserPasswordSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const target = await prisma.user.findFirst({
      where: { id: data.userId, projectId: context.projectId },
    });
    if (!target) {
      throw new Error('User not found in this project');
    }
    const request = getRequest();
    await auth.api.setUserPassword({
      body: { userId: data.userId, newPassword: data.password },
      headers: request.headers,
    });
  });

export const deleteProjectUser = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: targetUserId, context }) => {
    const target = await prisma.user.findFirst({
      where: { id: targetUserId, projectId: context.projectId },
    });
    if (!target) {
      throw new Error('User not found in this project');
    }
    if (target.role === 'admin') {
      const adminCount = await prisma.user.count({
        where: { projectId: context.projectId, role: 'admin' },
      });
      if (adminCount <= 1) {
        throw new Error('Cannot remove the last admin of a project');
      }
    }
    const request = getRequest();
    await auth.api.removeUser({
      body: { userId: targetUserId },
      headers: request.headers,
    });
  });
