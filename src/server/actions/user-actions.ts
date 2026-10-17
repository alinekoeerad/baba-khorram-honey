/**
 * Admin User Management Server Actions (Phase 2, Task 8)
 * Implements:
 * - Admin user creation with temporary password
 * - Status activation/deactivation with self-deactivation protection & last-active-admin protection
 * - Session invalidation on deactivation
 * - Password changes for users
 * - Full audit logging with no secret leakage
 */

'use server';

import { z } from 'zod';
import { db, UserRecord } from '@/server/db/client';
import { hashPassword } from '@/server/auth/password';
import { createAdminAction } from './admin-action-wrapper';
import { uiStringsFa } from '@/content/ui-strings.fa';
import { requireAdmin } from '@/server/auth/require-admin';

// -----------------------------------------------------------------
// 1. Create Admin User
// -----------------------------------------------------------------

const createAdminSchema = z.object({
  name: z.string().min(2, uiStringsFa.validation.nameRequired),
  email: z.string().email(uiStringsFa.validation.emailInvalid),
  temporaryPassword: z.string().min(8, uiStringsFa.validation.passwordMinLength),
});

export const createAdminUserAction = createAdminAction({
  schema: createAdminSchema,
  audit: {
    action: 'USER_CREATE',
    entityType: 'User',
    getEntityId: (result: any) => result.id,
    getSummary: (input, user) =>
      `Admin user «${input.name}» (${input.email.toLowerCase()}) created by «${user.name || user.email}»`,
  },
  handler: async (input, context) => {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check email uniqueness
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new Error('کاربری با این نشانی ایمیل قبلاً در سامانه ثبت شده است.');
    }

    const hashedPassword = await hashPassword(input.temporaryPassword);

    const newUser = await db.user.create({
      data: {
        name: input.name.trim(),
        email: normalizedEmail,
        role: 'ADMIN',
        isActive: true,
      },
    });

    await db.account.create({
      data: {
        userId: newUser.id,
        accountId: newUser.id,
        providerId: 'credential',
        password: hashedPassword,
      },
    });

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
    };
  },
});

// -----------------------------------------------------------------
// 2. Toggle User Active Status (with Last Admin & Self Protection)
// -----------------------------------------------------------------

const toggleStatusSchema = z.object({
  userId: z.string().min(1),
  isActive: z.boolean(),
});

export const toggleUserStatusAction = createAdminAction({
  schema: toggleStatusSchema,
  audit: {
    action: 'USER_STATUS_CHANGE',
    entityType: 'User',
    getEntityId: (_result, input) => input.userId,
    getSummary: (input, user) =>
      `Admin user status changed to ${input.isActive ? 'ACTIVE' : 'DEACTIVATED'} for userId: ${input.userId} by «${user.name || user.email}»`,
  },
  handler: async (input, context) => {
    const { userId, isActive } = input;

    // Rule 1: No self-deactivation
    if (userId === context.user.id && !isActive) {
      throw new Error(uiStringsFa.adminUsers.cannotDeactivateSelf);
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      throw new Error('کاربر مورد نظر یافت نشد.');
    }

    // Rule 2: Never deactivate or delete the last active admin
    if (!isActive && targetUser.isActive) {
      const activeAdminCount = await db.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (activeAdminCount <= 1) {
        throw new Error(uiStringsFa.adminUsers.cannotDeactivateLastAdmin);
      }
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { isActive },
    });

    // Rule 3: Sessions invalidate immediately on deactivation (Task 1 & Task 8)
    if (!isActive) {
      await db.session.deleteMany({
        where: { userId },
      });
    }

    return {
      id: updated.id,
      isActive: updated.isActive,
    };
  },
});

// -----------------------------------------------------------------
// 3. Change Another User's Password
// -----------------------------------------------------------------

const changePasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(8, uiStringsFa.validation.passwordMinLength),
});

export const changeUserPasswordAction = createAdminAction({
  schema: changePasswordSchema,
  audit: {
    action: 'PASSWORD_CHANGE',
    entityType: 'User',
    getEntityId: (_result, input) => input.userId,
    getSummary: (_input, user, result: any) =>
      `Password changed for admin user «${result?.email || 'admin'}» by «${user.name || user.email}»`,
  },
  handler: async (input) => {
    const targetUser = await db.user.findUnique({ where: { id: input.userId } });
    if (!targetUser) {
      throw new Error('کاربر مورد نظر یافت نشد.');
    }

    const hashedPassword = await hashPassword(input.newPassword);

    const existingAccount = await db.account.findFirst({
      where: { userId: targetUser.id, providerId: 'credential' },
    });

    if (existingAccount) {
      await db.account.update({
        where: { id: existingAccount.id },
        data: { password: hashedPassword },
      });
    } else {
      await db.account.create({
        data: {
          userId: targetUser.id,
          accountId: targetUser.id,
          providerId: 'credential',
          password: hashedPassword,
        },
      });
    }

    // Invalidate all existing sessions for this user so they must sign in with new password
    await db.session.deleteMany({
      where: { userId: targetUser.id },
    });

    return {
      id: targetUser.id,
      email: targetUser.email,
    };
  },
});

// -----------------------------------------------------------------
// 4. Delete Admin User (With Super Admin & Last Admin Protection)
// -----------------------------------------------------------------

const deleteAdminUserSchema = z.object({
  userId: z.string().min(1),
});

export const deleteAdminUserAction = createAdminAction({
  schema: deleteAdminUserSchema,
  audit: {
    action: 'USER_DELETE',
    entityType: 'User',
    getEntityId: (_result, input) => input.userId,
    getSummary: (_input, user, result: any) =>
      `Admin user «${result?.email || 'admin'}» permanently deleted by «${user.name || user.email}»`,
  },
  handler: async (input, context) => {
    const { userId } = input;

    // Protection 1: Never delete self
    if (userId === context.user.id) {
      throw new Error('حذف حساب کاربری فعال خودتان امکان‌پذیر نیست.');
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      throw new Error('کاربر مورد نظر یافت نشد.');
    }

    // Protection 2: Primary Super Admin protection (admin@honey.ir or root initial admin)
    const normalizedEmail = targetUser.email.toLowerCase().trim();
    if (normalizedEmail === 'admin@honey.ir') {
      throw new Error('حذف حساب مدیر کل اصلی امکان‌پذیر نیست.');
    }

    const allAdmins = await db.user.findMany({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
    });
    if (allAdmins.length > 0 && allAdmins[0].id === targetUser.id) {
      throw new Error('حذف حساب مدیر کل اصلی امکان‌پذیر نیست.');
    }

    // Protection 3: Never delete the last active admin
    const activeAdminCount = await db.user.count({
      where: { role: 'ADMIN', isActive: true },
    });
    if (targetUser.isActive && activeAdminCount <= 1) {
      throw new Error('امکان حذف آخرین مدیر فعال سامانه وجود ندارد.');
    }

    // Delete related sessions & accounts
    await db.session.deleteMany({ where: { userId } });
    await db.account.deleteMany({ where: { userId } });
    await db.user.delete({ where: { id: userId } });

    return {
      success: true,
      id: targetUser.id,
      email: targetUser.email,
    };
  },
});

// -----------------------------------------------------------------
// 5. Query Admin Users List
// -----------------------------------------------------------------

export async function getAdminUsersList(): Promise<UserRecord[]> {
  await requireAdmin({ allowRedirect: true });
  return await db.user.findMany({
    orderBy: { createdAt: 'asc' },
  });
}

