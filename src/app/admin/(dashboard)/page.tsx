import React from 'react';
import Link from 'next/link';
import { db } from '@/server/db/client';
import { getRecentAuditLogs } from '@/server/services/audit-log-service';
import { uiStringsFa } from '@/content/ui-strings.fa';
import { Package, BookOpen, Layers, MessageSquare, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import { AdminBadge } from '@/components/admin/admin-badge';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Query status counts & catalog health metrics
  const [
    totalProducts,
    publishedProducts,
    draftProducts,
    archivedProducts,
    inStockProducts,
    outOfStockProducts,
    featuredProducts,
    totalRecipes,
    publishedRecipes,
    draftRecipes,
    archivedRecipes,
    totalCategories,
    unreadFeedbacks,
    activeAdmins,
    recentAuditLogs,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: 'PUBLISHED' } }),
    db.product.count({ where: { status: 'DRAFT' } }),
    db.product.count({ where: { status: 'ARCHIVED' } }),
    db.product.count({ where: { isAvailable: true, status: 'PUBLISHED' } }),
    db.product.count({ where: { isAvailable: false, status: 'PUBLISHED' } }),
    db.product.count({ where: { isFeatured: true } }),
    db.recipe.count(),
    db.recipe.count({ where: { status: 'PUBLISHED' } }),
    db.recipe.count({ where: { status: 'DRAFT' } }),
    db.recipe.count({ where: { status: 'ARCHIVED' } }),
    db.category.count(),
    db.feedback.count({ where: { status: 'UNREAD' } }),
    db.user.count({ where: { role: 'ADMIN', isActive: true } }),
    getRecentAuditLogs(10),
  ]);

  const stockRatio = publishedProducts > 0
    ? Math.round((inStockProducts / publishedProducts) * 100)
    : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE9E0] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#2B2017]">{uiStringsFa.adminDashboard.title}</h1>
          <p className="text-sm text-[#5C5248] mt-1">{uiStringsFa.adminDashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] text-xs font-bold transition-colors shadow-xs"
          >
            + محصول جدید
          </Link>
          <Link
            href="/admin/recipes/new"
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-[#2B2017] text-xs font-bold border border-[#EFE9E0] transition-colors"
          >
            + دستور جدید
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Products Card */}
        <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wide flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#D97706]" />
              <span>{uiStringsFa.adminDashboard.productsOverview}</span>
            </span>
            <span className="text-2xl font-black text-[#332115]">{totalProducts}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-[#EFE9E0] grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="font-bold text-[#3F8F3B]">{publishedProducts}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">{uiStringsFa.adminDashboard.publishedCount}</div>
            </div>
            <div>
              <div className="font-bold text-[#E07D2B]">{draftProducts}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">{uiStringsFa.adminDashboard.draftCount}</div>
            </div>
            <div>
              <div className="font-bold text-[#5C5248]">{archivedProducts}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">{uiStringsFa.adminDashboard.archivedCount}</div>
            </div>
          </div>
        </div>

        {/* Recipes Card */}
        <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#3F8F3B] uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#3F8F3B]" />
              <span>{uiStringsFa.adminDashboard.recipesOverview}</span>
            </span>
            <span className="text-2xl font-black text-[#332115]">{totalRecipes}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-[#EFE9E0] grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="font-bold text-[#3F8F3B]">{publishedRecipes}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">{uiStringsFa.adminDashboard.publishedCount}</div>
            </div>
            <div>
              <div className="font-bold text-[#E07D2B]">{draftRecipes}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">{uiStringsFa.adminDashboard.draftCount}</div>
            </div>
            <div>
              <div className="font-bold text-[#5C5248]">{archivedRecipes}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">{uiStringsFa.adminDashboard.archivedCount}</div>
            </div>
          </div>
        </div>

        {/* Catalog & Categories */}
        <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#C86A00] uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#C86A00]" />
              <span>دسته‌بندی و پوشش</span>
            </span>
            <span className="text-2xl font-black text-[#332115]">{totalCategories}</span>
          </div>
          <p className="text-xs text-[#5C5248] mt-3">
            دسته‌بندی‌های فعال کاتالوگ عسل و دستورهای طب سنتی
          </p>
          <div className="mt-4 pt-3 border-t border-[#EFE9E0]">
            <Link
              href="/admin/categories"
              className="text-xs font-bold text-[#D97706] hover:text-[#C86A00] flex items-center justify-between"
            >
              <span>مدیریت دسته‌ها</span>
              <span>←</span>
            </Link>
          </div>
        </div>

        {/* Feedback Alert Card */}
        <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9E3556] uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#9E3556]" />
              <span>بازخوردها و پیام‌ها</span>
            </span>
            <span className="text-2xl font-black text-[#332115] flex items-center gap-1.5">
              {unreadFeedbacks > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
              )}
              <span>{unreadFeedbacks}</span>
            </span>
          </div>
          <p className="text-xs text-[#5C5248] mt-3">
            {unreadFeedbacks > 0
              ? `${unreadFeedbacks} پیام و پیشنهاد جدید در انتظار بررسی مدیر`
              : 'تمام بازخوردهای مشتریان بررسی و رسیدگی شده‌اند'}
          </p>
          <div className="mt-4 pt-3 border-t border-[#EFE9E0]">
            <Link
              href="/admin/feedbacks"
              className="text-xs font-bold text-[#9E3556] hover:text-[#7A1D39] flex items-center justify-between"
            >
              <span>مشاهده صندوق پیام‌ها</span>
              <span>←</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Catalog Health & Stock Metrics Section [ADM-FEAT-04] */}
      <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFE9E0] pb-3">
          <div>
            <h2 className="text-base font-black text-[#2B2017] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#D97706]" />
              <span>شاخص‌های سلامت کاتالوگ و انبارداری (Catalog Health & Stock)</span>
            </h2>
            <p className="text-xs text-[#5C5248] mt-0.5">
              وضعیت دسترسی‌پذیری محصولات عمومی، کالاهای ویژه و موجودی انبار
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#2B2017]">نرخ موجودی محصولات:</span>
            <span className={`font-mono font-bold px-2 py-0.5 ${stockRatio >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              %{stockRatio}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-[#5C5248]">
            <span>موجود در انبار: {inStockProducts} قلم</span>
            <span>ناموجود: {outOfStockProducts} قلم</span>
          </div>
          <div className="w-full h-3 bg-rose-100 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${stockRatio}%` }}
              title={`موجود: ${stockRatio}%`}
            />
          </div>
        </div>

        {/* Breakdown Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="flex items-center gap-3 p-3 bg-[#FDFBF8] border border-[#EFE9E0]">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-[#2B2017]">محصولات فعال و در دسترس</div>
              <div className="text-[11px] text-[#5C5248] mt-0.5">{inStockProducts} محصول آماده خرید آنلاین</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#FDFBF8] border border-[#EFE9E0]">
            <AlertTriangle className={`w-5 h-5 shrink-0 ${outOfStockProducts > 0 ? 'text-rose-600' : 'text-stone-400'}`} />
            <div>
              <div className="text-xs font-bold text-[#2B2017]">محصولات ناموجود</div>
              <div className="text-[11px] text-[#5C5248] mt-0.5">
                {outOfStockProducts > 0 ? `${outOfStockProducts} محصول نیازمند شارژ انبار` : 'هیچ محصولی ناموجود نیست'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#FDFBF8] border border-[#EFE9E0]">
            <Package className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-[#2B2017]">محصولات ویژه صفحه اصلی</div>
              <div className="text-[11px] text-[#5C5248] mt-0.5">{featuredProducts} محصول دارای نشان ویژه</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="bg-[#FFFBEB] border border-[#EFE9E0] p-6 shadow-xs">
        <h2 className="text-base font-bold text-[#332115] mb-4">{uiStringsFa.adminDashboard.quickLinks}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/products"
            className="flex items-center justify-between p-3.5 bg-white border border-[#EFE9E0] text-sm font-bold text-[#332115] hover:border-[#D97706] transition-colors"
          >
            <span>{uiStringsFa.adminDashboard.manageProducts}</span>
            <span className="text-[#D97706]">←</span>
          </Link>
          <Link
            href="/admin/recipes"
            className="flex items-center justify-between p-3.5 bg-white border border-[#EFE9E0] text-sm font-bold text-[#332115] hover:border-[#D97706] transition-colors"
          >
            <span>{uiStringsFa.adminDashboard.manageRecipes}</span>
            <span className="text-[#D97706]">←</span>
          </Link>
          <Link
            href="/admin/homepage"
            className="flex items-center justify-between p-3.5 bg-white border border-[#EFE9E0] text-sm font-bold text-[#332115] hover:border-[#D97706] transition-colors"
          >
            <span>مدیریت صفحه اصلی (CMS)</span>
            <span className="text-[#D97706]">←</span>
          </Link>
          <Link
            href="/admin/audit-log"
            className="flex items-center justify-between p-3.5 bg-white border border-[#EFE9E0] text-sm font-bold text-[#332115] hover:border-[#D97706] transition-colors"
          >
            <span>{uiStringsFa.adminDashboard.viewAuditLog}</span>
            <span className="text-[#D97706]">←</span>
          </Link>
        </div>
      </div>

      {/* Last 10 Audit Entries */}
      <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#332115]">{uiStringsFa.adminDashboard.recentAuditLogs}</h2>
          <Link
            href="/admin/audit-log"
            className="text-xs font-bold text-[#D97706] hover:underline"
          >
            {uiStringsFa.adminDashboard.viewAuditLog}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EFE9E0] text-[#5C5248] bg-[#FDFBF8]">
                <th className="py-2.5 px-3 text-start">{uiStringsFa.adminAuditLog.timestamp}</th>
                <th className="py-2.5 px-3 text-start">{uiStringsFa.adminAuditLog.user}</th>
                <th className="py-2.5 px-3 text-start">{uiStringsFa.adminAuditLog.action}</th>
                <th className="py-2.5 px-3 text-start">{uiStringsFa.adminAuditLog.entity}</th>
                <th className="py-2.5 px-3 text-start">{uiStringsFa.adminAuditLog.summary}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0]">
              {recentAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#5C5248]">
                    {uiStringsFa.adminAuditLog.noRecordsFound}
                  </td>
                </tr>
              ) : (
                recentAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FFFBEB]/40 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#5C5248]" dir="ltr">
                      {new Date(log.createdAt).toLocaleString('fa-IR')}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-bold text-[#332115]">
                      {log.userName || log.userEmail || 'سامانه'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 font-mono text-[10px] font-bold bg-amber-100 text-amber-900">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#5C5248] font-medium">{log.entityType}</td>
                    <td className="py-2.5 px-3 text-[#332115] max-w-md truncate" title={log.summary}>{log.summary}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
