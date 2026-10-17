'use client';

/**
 * Audit Log Viewer Client Component (Phase 2, Task 6)
 * Filterable log viewer with user/action/entity filters and "Load more" pagination.
 */

import React, { useState, useTransition } from 'react';
import type { AuditLogEntry } from '@/server/services/audit-log-service';
import { uiStringsFa } from '@/content/ui-strings.fa';
import { Shield, Filter, RotateCcw, Loader2, Download } from 'lucide-react';
import { exportToCsv } from '@/lib/csv-export';

interface AuditLogViewerProps {
  initialLogs: AuditLogEntry[];
  initialCursor: string | null;
  totalCount: number;
  users: Array<{ id: string; name: string | null; email: string }>;
  onLoadMoreAction: (params: {
    userId?: string;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
    cursor?: string;
  }) => Promise<{ logs: AuditLogEntry[]; nextCursor: string | null }>;
}

export function AuditLogViewer({
  initialLogs,
  initialCursor,
  totalCount,
  users,
  onLoadMoreAction,
}: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, startLoadMore] = useTransition();

  // Filters
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const actions = [
    'LOGIN_SUCCESS',
    'LOGIN_FAILURE',
    'LOGOUT',
    'CREATE',
    'UPDATE',
    'DELETE',
    'MEDIA_UPLOAD',
    'STATUS_CHANGE',
  ];

  const entities = [
    'User',
    'Product',
    'Recipe',
    'Category',
    'MediaAsset',
    'SiteSettings',
    'ContactChannel',
  ];

  const handleApplyFilter = () => {
    startTransition(async () => {
      const res = await onLoadMoreAction({
        userId: selectedUser || undefined,
        action: selectedAction || undefined,
        entityType: selectedEntity || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setLogs(res.logs);
      setCursor(res.nextCursor);
    });
  };

  const handleResetFilter = () => {
    setSelectedUser('');
    setSelectedAction('');
    setSelectedEntity('');
    setDateFrom('');
    setDateTo('');
    startTransition(async () => {
      const res = await onLoadMoreAction({});
      setLogs(res.logs);
      setCursor(res.nextCursor);
    });
  };

  const handleLoadMore = () => {
    if (!cursor) return;
    startLoadMore(async () => {
      const res = await onLoadMoreAction({
        userId: selectedUser || undefined,
        action: selectedAction || undefined,
        entityType: selectedEntity || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        cursor,
      });
      setLogs((prev) => [...prev, ...res.logs]);
      setCursor(res.nextCursor);
    });
  };

  const handleExportCsv = () => {
    const headers = ['شناسه', 'زمان ثبت', 'کاربر', 'ایمیل', 'نوع اقدام', 'موجودیت', 'شناسه موجودیت', 'خلاصه تغییرات', 'آدرس IP'];
    const rows = logs.map((log) => [
      log.id,
      new Date(log.createdAt).toLocaleString('fa-IR'),
      log.userName || '',
      log.userEmail || '',
      log.action,
      log.entityType,
      log.entityId || '',
      log.summary,
      log.ip || '',
    ]);
    exportToCsv('audit_logs_export', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFE9E0]">
        <div>
          <h1 className="text-2xl font-black text-[#2B2017] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#D97706]" />
            <span>گزارش وقایع و ردپای امنیتی (Audit Log)</span>
          </h1>
          <p className="text-sm text-[#5C5248] mt-1">
            ثبت تمامی تغییرات، ورودها و اقدامات مدیریتی بدون ذخیره اطلاعات حساس (مجموع: {totalCount} رویداد)
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#EFE9E0] bg-white hover:bg-amber-50 text-xs font-bold text-[#2B2017] transition-colors shadow-xs rounded-none"
        >
          <Download className="w-4 h-4 text-[#D97706]" />
          <span>خروجی اکسل (CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#EFE9E0] rounded-none p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#5C5248] mb-1.5">کاربر / مدیر</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-[#FDFBF8] border border-[#EFE9E0] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
            >
              <option value="">همه کاربران</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C5248] mb-1.5">نوع عملیات</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-[#FDFBF8] border border-[#EFE9E0] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
            >
              <option value="">همه عملیات‌ها</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C5248] mb-1.5">موجودیت (Entity)</label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full bg-[#FDFBF8] border border-[#EFE9E0] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
            >
              <option value="">همه موجودیت‌ها</option>
              {entities.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C5248] mb-1.5">از تاریخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-[#FDFBF8] border border-[#EFE9E0] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C5248] mb-1.5">تا تاریخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-[#FDFBF8] border border-[#EFE9E0] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EFE9E0]">
          <button
            type="button"
            onClick={handleResetFilter}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none border border-[#EFE9E0] text-xs font-bold text-[#5C5248] hover:bg-stone-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>پاکسازی فیلتر</span>
          </button>
          <button
            type="button"
            onClick={handleApplyFilter}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-none bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-bold transition-colors shadow-xs"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5" />}
            <span>اعمال فیلتر</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#EFE9E0] rounded-none shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-[#FDFBF8] border-b border-[#EFE9E0] text-[#5C5248] font-bold">
                <th className="py-3 px-4">زمان ثبت</th>
                <th className="py-3 px-4">کاربر</th>
                <th className="py-3 px-4">نوع اقدام</th>
                <th className="py-3 px-4">موجودیت</th>
                <th className="py-3 px-4">خلاصه تغییرات</th>
                <th className="py-3 px-4 text-center">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-amber-50/20 transition-colors">
                  <td className="py-3 px-4 text-[#5C5248] whitespace-nowrap" dir="ltr">
                    {new Date(log.createdAt).toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#2B2017]">
                    {log.userName || log.userEmail || 'سامانه'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded-none font-mono text-[10px] font-bold bg-amber-100 text-amber-900">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#5C5248] font-medium">
                    {log.entityType} {log.entityId ? `(#${log.entityId.slice(-4)})` : ''}
                  </td>
                  <td className="py-3 px-4 text-[#2B2017] max-w-md truncate" title={log.summary}>
                    {log.summary}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-[11px] text-stone-500" dir="ltr">
                    {log.ip || '—'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#5C5248]">
                    هیچ رخدادی با فیلترهای مشخص‌شده یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Pagination */}
        {cursor && (
          <div className="p-4 border-t border-[#EFE9E0] text-center bg-[#FDFBF8]">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-none bg-white border border-[#EFE9E0] hover:bg-stone-50 text-xs font-bold text-[#2B2017] transition-colors shadow-xs disabled:opacity-50"
            >
              {isLoadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>بارگذاری وقایع بیشتر</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
