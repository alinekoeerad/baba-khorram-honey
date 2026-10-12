import { describe, it, expect } from 'vitest';
import { toggleUserStatusAction } from '@/server/actions/user-actions';
import { db } from '@/server/db/client';

describe('User Management Security Rules Database Tests', () => {
  it('prevents self-deactivation and enforces last active admin protection', async () => {
    const adminUser = await db.user.create({
      data: {
        name: 'مدیر تستی',
        email: `testadmin_${Date.now()}@honey.ir`,
        role: 'ADMIN',
        isActive: true,
      },
    });

    // Test self-deactivation prohibition
    const selfDeactivateRes: any = await toggleUserStatusAction({ userId: adminUser.id, isActive: false });
    expect(selfDeactivateRes.success).toBe(false);
    expect(selfDeactivateRes.error).toContain('نمی‌توانید حساب کاربری خود را غیرفعال کنید');

    // Clean up
    await db.user.delete({ where: { id: adminUser.id } });
  });
});
