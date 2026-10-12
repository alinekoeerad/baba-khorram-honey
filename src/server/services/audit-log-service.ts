/**
 * Audit Logging Service (Brief Section 8 & Phase 2)
 * Records and retrieves administrative, security, and authentication audit logs.
 * Guarantees zero sensitive secrets (passwords, tokens) in audit entries.
 */

import { db, UserRecord } from '@/server/db/client';

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail?: string | null;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface CreateAuditLogInput {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  ip?: string | null;
  userAgent?: string | null;
}

export interface QueryAuditLogsOptions {
  userId?: string;
  action?: string;
  entityType?: string;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  cursor?: string;
  take?: number;
}

export interface QueryAuditLogsResult {
  logs: AuditLogEntry[];
  nextCursor: string | null;
  totalCount: number;
}

/**
 * Sanitizes audit summary text to ensure no passwords or tokens are accidentally logged.
 */
function sanitizeSummary(summary: string): string {
  if (!summary) return '';
  return summary
    .replace(/(?:password|token|secret|key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .replace(/\$argon2[^\s]+/gi, '[REDACTED_HASH]')
    .replace(/\$scrypt[^\s]+/gi, '[REDACTED_HASH]')
    .slice(0, 1000); // Safety limit on log length
}

/**
 * Records an audit log entry in the database.
 */
export async function recordAuditLog(input: CreateAuditLogInput): Promise<AuditLogEntry> {
  const sanitizedSummary = sanitizeSummary(input.summary);

  const record = await db.auditLog.create({
    data: {
      userId: input.userId || null,
      action: input.action.toUpperCase(),
      entityType: input.entityType,
      entityId: input.entityId || null,
      summary: sanitizedSummary,
      ip: input.ip ? input.ip.slice(0, 45) : null, // IPv6 max length
      userAgent: input.userAgent ? input.userAgent.slice(0, 255) : null,
      createdAt: new Date(),
    },
  });

  let userEmail: string | null = null;
  let userName: string | null = null;
  if (record.userId) {
    const user = await db.user.findUnique({ where: { id: record.userId } });
    if (user) {
      userEmail = user.email;
      userName = user.name;
    }
  }

  return {
    id: record.id,
    userId: record.userId,
    userEmail,
    userName,
    action: record.action,
    entityType: record.entityType,
    entityId: record.entityId,
    summary: record.summary,
    ip: record.ip,
    userAgent: record.userAgent,
    createdAt: new Date(record.createdAt),
  };
}

/**
 * Queries audit logs with filtering, sorting (descending by createdAt), and cursor pagination.
 */
export async function queryAuditLogs(options: QueryAuditLogsOptions = {}): Promise<QueryAuditLogsResult> {
  const take = Math.min(Math.max(options.take || 20, 1), 100);
  const where: any = {};

  if (options.userId) {
    where.userId = options.userId;
  }
  if (options.action) {
    where.action = options.action.toUpperCase();
  }
  if (options.entityType) {
    where.entityType = options.entityType;
  }

  if (options.dateFrom || options.dateTo) {
    where.createdAt = {};
    if (options.dateFrom) {
      where.createdAt.gte = new Date(options.dateFrom);
    }
    if (options.dateTo) {
      const toDate = new Date(options.dateTo);
      // If time is 00:00:00, extend to end of day
      if (toDate.getHours() === 0 && toDate.getMinutes() === 0) {
        toDate.setHours(23, 59, 59, 999);
      }
      where.createdAt.lte = toDate;
    }
  }

  const totalCount = await db.auditLog.count({ where });

  // Fetch take + 1 to check if there are more items
  let skip = 0;
  if (options.cursor) {
    const allMatching = await db.auditLog.findMany({ where, orderBy: { createdAt: 'desc' } });
    const cursorIdx = allMatching.findIndex((l: any) => l.id === options.cursor);
    if (cursorIdx !== -1) {
      skip = cursorIdx + 1;
    }
  }

  const rawLogs = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take: take + 1,
  });

  const hasMore = rawLogs.length > take;
  const itemsToReturn = hasMore ? rawLogs.slice(0, take) : rawLogs;
  const nextCursor = hasMore ? itemsToReturn[itemsToReturn.length - 1].id : null;

  // Resolve user info for items
  const allUsers: UserRecord[] = await db.user.findMany();
  const userMap = new Map<string, { email: string; name: string | null }>();
  for (const u of allUsers) {
    userMap.set(u.id, { email: u.email, name: u.name });
  }

  const logs: AuditLogEntry[] = itemsToReturn.map((l: any) => {
    const userInfo = l.userId ? userMap.get(l.userId) : null;
    return {
      id: l.id,
      userId: l.userId,
      userEmail: userInfo?.email || null,
      userName: userInfo?.name || null,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      summary: l.summary,
      ip: l.ip,
      userAgent: l.userAgent,
      createdAt: new Date(l.createdAt),
    };
  });

  return {
    logs,
    nextCursor,
    totalCount,
  };
}

/**
 * Retrieves the last 10 audit entries for dashboard quick view.
 */
export async function getRecentAuditLogs(limit: number = 10): Promise<AuditLogEntry[]> {
  const result = await queryAuditLogs({ take: limit });
  return result.logs;
}
