import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { db } from '@/server/db/client';
import { queryAuditLogs, AuditLogEntry } from '@/server/services/audit-log-service';
import { AuditLogViewer } from './audit-log-viewer';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogPage() {
  await requireAdmin({ allowRedirect: true });

  const [initialData, users] = await Promise.all([
    queryAuditLogs({ take: 20 }),
    db.user.findMany({ orderBy: { name: 'asc' } }),
  ]);

  // Server action for loading more or filtering
  async function loadMoreLogsAction(params: {
    userId?: string;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
    cursor?: string;
  }) {
    'use server';
    await requireAdmin({ allowRedirect: false });
    const res = await queryAuditLogs({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      cursor: params.cursor,
      take: 20,
    });
    return {
      logs: res.logs,
      nextCursor: res.nextCursor,
    };
  }

  return (
    <AuditLogViewer
      initialLogs={initialData.logs}
      initialCursor={initialData.nextCursor}
      totalCount={initialData.totalCount}
      users={users}
      onLoadMoreAction={loadMoreLogsAction}
    />
  );
}
