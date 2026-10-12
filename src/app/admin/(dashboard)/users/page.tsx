import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { db } from '@/server/db/client';
import { AdminUsersManager } from './users-manager';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const { user: currentAdmin } = await requireAdmin({ allowRedirect: true });

  const users = await db.user.findMany({
    orderBy: { createdAt: 'asc' },
  });

  return (
    <AdminUsersManager
      initialUsers={users}
      currentUserId={currentAdmin.id}
    />
  );
}
