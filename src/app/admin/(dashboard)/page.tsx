import React from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/server/auth/require-admin';
import { db, OrderRecord } from '@/server/db/client';
import { getRecentAuditLogs } from '@/server/services/audit-log-service';
import { getSystemHealthReport } from '@/server/services/system-health-service';
import { uiStringsFa } from '@/content/ui-strings.fa';
import { toPersianDigits } from '@/lib/utils';
import {
  Package,
  BookOpen,
  Layers,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Shield,
  ShoppingBag,
  TrendingUp,
  BarChart3,
  Award,
  PhoneCall,
  Clock,
  Truck,
  XCircle,
  Share2,
  HardDrive,
  Database,
  Radio,
  MapPin,
  Users,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Activity,
  Bot,
  FileCheck,
} from 'lucide-react';
import {
  DatabaseBackupButton,
  ResendOrderNotificationButton,
} from '@/components/admin/dashboard-monitoring-actions';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdmin({ allowRedirect: true });

  // 1. Fetch system health metrics and domain statistics in parallel
  const [
    rawOrders,
    totalOrders,
    newOrders,
    contactedOrders,
    shippedOrders,
    cancelledOrders,
    totalProducts,
    publishedProducts,
    draftProducts,
    archivedProducts,
    inStockProducts,
    outOfStockProducts,
    featuredProducts,
    allProductsCatalog,
    totalRecipes,
    publishedRecipes,
    draftRecipes,
    archivedRecipes,
    totalCategories,
    unreadFeedbacks,
    recentFeedbacks,
    activeAdmins,
    recentAuditLogs,
    systemHealth,
  ] = await Promise.all([
    db.order.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }),
    db.order.count(),
    db.order.count({ where: { status: 'NEW' } }),
    db.order.count({ where: { status: 'CONTACTED' } }),
    db.order.count({ where: { status: 'SHIPPED' } }),
    db.order.count({ where: { status: 'CANCELLED' } }),
    db.product.count(),
    db.product.count({ where: { status: 'PUBLISHED' } }),
    db.product.count({ where: { status: 'DRAFT' } }),
    db.product.count({ where: { status: 'ARCHIVED' } }),
    db.product.count({ where: { isAvailable: true, status: 'PUBLISHED' } }),
    db.product.count({ where: { isAvailable: false, status: 'PUBLISHED' } }),
    db.product.count({ where: { isFeatured: true } }),
    db.product.findMany({
      select: {
        id: true,
        slug: true,
        nameFa: true,
        status: true,
        isAvailable: true,
        mainImageId: true,
        options: { select: { id: true } },
      },
    }),
    db.recipe.count(),
    db.recipe.count({ where: { status: 'PUBLISHED' } }),
    db.recipe.count({ where: { status: 'DRAFT' } }),
    db.recipe.count({ where: { status: 'ARCHIVED' } }),
    db.category.count(),
    db.feedback.count({ where: { status: 'UNREAD' } }),
    db.feedback.findMany({
      where: { status: 'UNREAD' },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    db.user.count({ where: { role: 'ADMIN', isActive: true } }),
    getRecentAuditLogs(10),
    getSystemHealthReport(),
  ]);

  const allOrders: OrderRecord[] = (rawOrders || []) as OrderRecord[];

  // 2. Financial Metrics: Total Revenue & Average Order Value (AOV)
  const totalRevenue = allOrders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // 3. Stock ratio
  const stockRatio =
    publishedProducts > 0
      ? Math.round((inStockProducts / publishedProducts) * 100)
      : 100;

  // 4. Calculate Daily Orders & Revenue over the last 7 days
  const now = new Date();
  const daysData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    const dayOrders = allOrders.filter((o: OrderRecord) => {
      const oDate = new Date(o.createdAt);
      return oDate >= startOfDay && oDate <= endOfDay;
    });

    const count = dayOrders.length;
    const revenue = dayOrders.reduce((sum: number, o: OrderRecord) => sum + (o.totalPrice || 0), 0);

    const isToday = i === 6;
    const isYesterday = i === 5;
    const dayNameFa = isToday
      ? 'امروز'
      : isYesterday
      ? 'دیروز'
      : d.toLocaleDateString('fa-IR', { weekday: 'short' });
    const dateFa = d.toLocaleDateString('fa-IR', { month: 'numeric', day: 'numeric' });

    return {
      index: i,
      date: d,
      dayNameFa,
      dateFa,
      count,
      revenue,
      isToday,
    };
  });

  const maxDailyCount = Math.max(...daysData.map((d) => d.count), 4);
  const total7DaysOrders = daysData.reduce((sum: number, d) => sum + d.count, 0);
  const total7DaysRevenue = daysData.reduce((sum: number, d) => sum + d.revenue, 0);

  // 5. Order Status Breakdown
  const statusCounts = {
    NEW: newOrders,
    CONTACTED: contactedOrders,
    SHIPPED: shippedOrders,
    CANCELLED: cancelledOrders,
  };
  const totalOrdersForBreakdown = totalOrders;
  const statusPercentages = {
    NEW: totalOrdersForBreakdown > 0 ? Math.round((statusCounts.NEW / totalOrdersForBreakdown) * 100) : 0,
    CONTACTED: totalOrdersForBreakdown > 0 ? Math.round((statusCounts.CONTACTED / totalOrdersForBreakdown) * 100) : 0,
    SHIPPED: totalOrdersForBreakdown > 0 ? Math.round((statusCounts.SHIPPED / totalOrdersForBreakdown) * 100) : 0,
    CANCELLED: totalOrdersForBreakdown > 0 ? Math.round((statusCounts.CANCELLED / totalOrdersForBreakdown) * 100) : 0,
  };

  // 6. Top Ordered Products
  const productSalesMap = new Map<string, { name: string; totalQty: number; orderCount: number; sampleOption: string }>();
  for (const order of allOrders) {
    if (Array.isArray(order.lines)) {
      for (const line of order.lines) {
        const key = line.productNameFa || line.productId || 'عسل طبیعی';
        const existing = productSalesMap.get(key) || {
          name: key,
          totalQty: 0,
          orderCount: 0,
          sampleOption: line.optionLabel || '',
        };
        existing.totalQty += line.qty || 1;
        existing.orderCount += 1;
        if (!existing.sampleOption && line.optionLabel) {
          existing.sampleOption = line.optionLabel;
        }
        productSalesMap.set(key, existing);
      }
    }
  }
  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 5);
  const maxTopQty = topProducts[0]?.totalQty || 1;

  // 7. Customer Contact Channels
  const channelCounts: Record<string, number> = {
    BALE: 0,
    EITAA: 0,
    WHATSAPP: 0,
    TELEGRAM: 0,
    PHONE: 0,
  };
  for (const order of allOrders) {
    const raw = (order.preferredContact || order.channelType || 'PHONE').toUpperCase();
    if (raw.includes('BALE')) {
      channelCounts.BALE += 1;
    } else if (raw.includes('EITAA')) {
      channelCounts.EITAA += 1;
    } else if (raw.includes('WHATSAPP')) {
      channelCounts.WHATSAPP += 1;
    } else if (raw.includes('TELEGRAM')) {
      channelCounts.TELEGRAM += 1;
    } else {
      channelCounts.PHONE += 1;
    }
  }
  const totalChannelsCount = allOrders.length;
  const channelsMeta = [
    {
      key: 'BALE',
      nameFa: 'پیام‌رسان بله',
      latinName: 'Bale',
      color: '#0284C7',
      bgClass: 'bg-sky-50',
      borderClass: 'border-sky-300',
      count: channelCounts.BALE,
    },
    {
      key: 'EITAA',
      nameFa: 'پیام‌رسان ایتا',
      latinName: 'Eitaa',
      color: '#EA580C',
      bgClass: 'bg-orange-50',
      borderClass: 'border-orange-300',
      count: channelCounts.EITAA,
    },
    {
      key: 'WHATSAPP',
      nameFa: 'واتساپ',
      latinName: 'WhatsApp',
      color: '#16A34A',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-300',
      count: channelCounts.WHATSAPP,
    },
    {
      key: 'TELEGRAM',
      nameFa: 'تلگرام',
      latinName: 'Telegram',
      color: '#0EA5E9',
      bgClass: 'bg-cyan-50',
      borderClass: 'border-cyan-300',
      count: channelCounts.TELEGRAM,
    },
    {
      key: 'PHONE',
      nameFa: 'تماس تلفنی / پیامک',
      latinName: 'Phone & SMS',
      color: '#6366F1',
      bgClass: 'bg-indigo-50',
      borderClass: 'border-indigo-300',
      count: channelCounts.PHONE,
    },
  ];

  // 8. Priority 2: Catalog Quality Control (Missing image, options, unavailable)
  const productsMissingImage = allProductsCatalog.filter((p) => !p.mainImageId);
  const productsMissingOptions = allProductsCatalog.filter((p) => !p.options || p.options.length === 0);
  const productsUnavailable = allProductsCatalog.filter((p) => !p.isAvailable && p.status === 'PUBLISHED');

  // 9. Priority 2: Customer Analytics (Top demand cities & repeat loyal customers)
  const cityCountMap = new Map<string, number>();
  const customerMobileMap = new Map<string, { mobile: string; name: string; orderCount: number; totalSpent: number }>();

  for (const order of allOrders) {
    if (order.customerCity?.trim()) {
      const city = order.customerCity.trim();
      cityCountMap.set(city, (cityCountMap.get(city) || 0) + 1);
    }
    if (order.customerMobile?.trim()) {
      const mob = order.customerMobile.trim();
      const existing = customerMobileMap.get(mob) || {
        mobile: mob,
        name: order.customerName || 'مشتری گرامی',
        orderCount: 0,
        totalSpent: 0,
      };
      existing.orderCount += 1;
      existing.totalSpent += order.totalPrice || 0;
      customerMobileMap.set(mob, existing);
    }
  }

  const topCities = Array.from(cityCountMap.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const loyalCustomers = Array.from(customerMobileMap.values())
    .filter((c) => c.orderCount > 1)
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5);

  // 10. Failed Dispatches / Recent Pending Orders needing notification
  const recentOrdersNeedingNotice = allOrders.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Header & Fast Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE9E0] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#2B2017]">{uiStringsFa.adminDashboard.title}</h1>
          <p className="text-sm text-[#5C5248] mt-1">{uiStringsFa.adminDashboard.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <DatabaseBackupButton />
          <Link
            href="/admin/orders"
            className="flex-1 sm:flex-none justify-center flex items-center px-3.5 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-black transition-colors shadow-xs rounded-none text-center"
          >
            مدیریت سفارشات ({toPersianDigits(newOrders)})
          </Link>
          <Link
            href="/admin/products/new"
            className="flex-1 sm:flex-none justify-center flex items-center px-3.5 py-2 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] text-xs font-bold transition-colors shadow-xs rounded-none text-center"
          >
            + محصول جدید
          </Link>
          <Link
            href="/admin/recipes/new"
            className="flex-1 sm:flex-none justify-center flex items-center px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-[#2B2017] text-xs font-bold border border-[#EFE9E0] transition-colors rounded-none text-center"
          >
            + دستور جدید
          </Link>
        </div>
      </div>

      {/* PRIORITY 1: System Health, Storage & Bots Diagnostic Bar */}
      <div className="bg-[#2B2017] text-white p-4 sm:p-5 shadow-sm border border-stone-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black tracking-wide text-amber-300">
              سلامت زیرساخت و ارتباطات سیستم (System Health & Bot Integrations)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-stone-300">
            <span>مدت فعالیت سرور: {toPersianDigits(Math.round(systemHealth.uptimeSeconds / 60))} دقیقه</span>
            <span>•</span>
            <Link href="/admin/settings" className="text-amber-400 hover:underline flex items-center gap-1 font-bold">
              <span>تنظیم توکن‌ها</span>
              <span>←</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Database Connectivity & Latency */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-none flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-stone-200">اتصال PostgreSQL</div>
                <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                  {systemHealth.database.connected
                    ? `پاسخ‌دهی: ${toPersianDigits(systemHealth.database.latencyMs)}ms`
                    : 'قطع ارتباط'}
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 text-[10px] font-black ${
                systemHealth.database.connected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {systemHealth.database.connected ? 'متصل و پایدار' : 'خطای اتصال'}
            </span>
          </div>

          {/* Upload Storage */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-none flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="font-bold text-stone-200">فضای ذخیره رسانه‌ها</div>
                <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                  {toPersianDigits(systemHealth.storage.fileCount)} فایل تصویری
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
              {toPersianDigits(systemHealth.storage.totalSizeMB)} MB
            </span>
          </div>

          {/* Bale Bot Status */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-none flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bot className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <div className="font-bold text-stone-200">ربات بله (Bale)</div>
                <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                  {systemHealth.bots.bale.chatIdMasked ? `Chat: ${systemHealth.bots.bale.chatIdMasked}` : 'تنظیم‌نشده'}
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold ${
                systemHealth.bots.bale.isConfigured
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-stone-500/20 text-stone-400 border border-stone-500/30'
              }`}
            >
              {systemHealth.bots.bale.isConfigured ? 'آماده ارسال' : 'غیرفعال'}
            </span>
          </div>

          {/* Eitaa Bot Status */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-none flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <div className="font-bold text-stone-200">وب‌هوک ایتا (Eitaa)</div>
                <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                  {systemHealth.bots.eitaa.chatIdMasked ? `Chat: ${systemHealth.bots.eitaa.chatIdMasked}` : 'تنظیم‌نشده'}
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold ${
                systemHealth.bots.eitaa.isConfigured
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  : 'bg-stone-500/20 text-stone-400 border border-stone-500/30'
              }`}
            >
              {systemHealth.bots.eitaa.isConfigured ? 'آماده ارسال' : 'غیرفعال'}
            </span>
          </div>
        </div>
      </div>

      {/* PRIORITY 1: Customer Feedback Alert Banner */}
      {unreadFeedbacks > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-rose-100 border border-rose-300 text-rose-700 shrink-0">
              <MessageSquare className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-black text-rose-950 flex items-center gap-2">
                <span>توجه: {toPersianDigits(unreadFeedbacks)} پیام و بازخورد جدید از سمت مشتریان دارید!</span>
                <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5">اقدام فوری</span>
              </div>
              <p className="text-xs text-rose-800 mt-0.5">
                آخرین پیام: {recentFeedbacks[0]?.message?.slice(0, 50) || 'بازخورد جدید'} - از {recentFeedbacks[0]?.name || 'مشتری'} ({recentFeedbacks[0]?.phone ? toPersianDigits(recentFeedbacks[0].phone) : 'شماره ثبت نشده'})
              </p>
            </div>
          </div>
          <Link
            href="/admin/feedbacks"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-black shadow-xs transition-colors shrink-0"
          >
            <span>مشاهده صندوق بازخوردها</span>
            <span>←</span>
          </Link>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-5">
        {/* Orders Card */}
        <div className="bg-white border-2 border-[#FDE68A] p-4 sm:p-6 shadow-xs relative overflow-hidden rounded-none">
          {newOrders > 0 && (
            <div className="absolute top-0 end-0 bg-rose-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-none animate-pulse">
              {toPersianDigits(newOrders)} جدید
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wide flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-[#D97706]" />
              <span>سفارشات ثبت‌شده</span>
            </span>
            <span className="text-2xl font-black text-[#332115]">{toPersianDigits(totalOrders)}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-[#EFE9E0] grid grid-cols-2 gap-2 text-center text-xs">
            <div>
              <div className="font-bold text-rose-600">{toPersianDigits(newOrders)}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">در انتظار هماهنگی</div>
            </div>
            <div>
              <div className="font-bold text-[#3F8F3B]">{toPersianDigits(contactedOrders)}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">هماهنگ شده</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#EFE9E0]">
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#D97706] hover:text-[#C86A00] flex items-center justify-between"
            >
              <span>مشاهده و پردازش سفارشات</span>
              <span>←</span>
            </Link>
          </div>
        </div>

        {/* Revenue & AOV Metric Card (Priority 1) */}
        <div className="bg-white border border-[#EFE9E0] p-4 sm:p-6 shadow-xs rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wide flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#D97706]" />
              <span>مجموع ارزش سفارشات</span>
            </span>
            <span className="text-lg font-black text-[#332115]">
              {toPersianDigits(totalRevenue.toLocaleString('fa-IR'))} <span className="text-xs font-normal">تومان</span>
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-[#EFE9E0] space-y-1 text-xs">
            <div className="flex justify-between items-center text-[#5C5248]">
              <span>میانگین ارزش سفارش (AOV):</span>
              <span className="font-bold text-[#332115]">{toPersianDigits(averageOrderValue.toLocaleString('fa-IR'))} تومان</span>
            </div>
            <div className="flex justify-between items-center text-[#5C5248]">
              <span>فروش ۷ روز اخیر:</span>
              <span className="font-bold text-emerald-700">{toPersianDigits(total7DaysRevenue.toLocaleString('fa-IR'))} تومان</span>
            </div>
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-white border border-[#EFE9E0] p-4 sm:p-6 shadow-xs rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wide flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#D97706]" />
              <span>{uiStringsFa.adminDashboard.productsOverview}</span>
            </span>
            <span className="text-2xl font-black text-[#332115]">{toPersianDigits(totalProducts)}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-[#EFE9E0] grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="font-bold text-[#3F8F3B]">{toPersianDigits(publishedProducts)}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">{uiStringsFa.adminDashboard.publishedCount}</div>
            </div>
            <div>
              <div className="font-bold text-[#E07D2B]">{toPersianDigits(draftProducts)}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">{uiStringsFa.adminDashboard.draftCount}</div>
            </div>
            <div>
              <div className="font-bold text-[#5C5248]">{toPersianDigits(archivedProducts)}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">{uiStringsFa.adminDashboard.archivedCount}</div>
            </div>
          </div>
        </div>

        {/* Recipes Card */}
        <div className="bg-white border border-[#EFE9E0] p-4 sm:p-6 shadow-xs rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#3F8F3B] uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#3F8F3B]" />
              <span>{uiStringsFa.adminDashboard.recipesOverview}</span>
            </span>
            <span className="text-2xl font-black text-[#332115]">{toPersianDigits(totalRecipes)}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-[#EFE9E0] grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="font-bold text-[#3F8F3B]">{toPersianDigits(publishedRecipes)}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">{uiStringsFa.adminDashboard.publishedCount}</div>
            </div>
            <div>
              <div className="font-bold text-[#E07D2B]">{toPersianDigits(draftRecipes)}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">{uiStringsFa.adminDashboard.draftCount}</div>
            </div>
            <div>
              <div className="font-bold text-[#5C5248]">{toPersianDigits(archivedRecipes)}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">{uiStringsFa.adminDashboard.archivedCount}</div>
            </div>
          </div>
        </div>

        {/* Feedback Alert Card */}
        <div className="bg-white border border-[#EFE9E0] p-4 sm:p-6 shadow-xs rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9E3556] uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#9E3556]" />
              <span>بازخوردها و پیام‌ها</span>
            </span>
            <span className="text-2xl font-black text-[#332115] flex items-center gap-1.5">
              {unreadFeedbacks > 0 && (
                <span className="w-2.5 h-2.5 rounded-none bg-rose-500 animate-ping inline-block" />
              )}
              <span>{toPersianDigits(unreadFeedbacks)}</span>
            </span>
          </div>
          <p className="text-xs text-[#5C5248] mt-3">
            {unreadFeedbacks > 0
              ? `${toPersianDigits(unreadFeedbacks)} پیام جدید در انتظار بررسی مدیر`
              : 'تمام بازخوردهای مشتریان بررسی شده‌اند'}
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

      {/* Store Monitoring & Analytics Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D5C7B8] pb-3">
          <div>
            <h2 className="text-lg font-black text-[#2B2017] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D97706]" />
              <span>پایپ‌لاین سفارشات و کانال‌های فروش (Order Pipeline & Messenger Funnel)</span>
            </h2>
            <p className="text-xs text-[#5C5248] mt-0.5">
              روند روزانه، سهم پیام‌رسان‌ها (ایتا، بله، واتساپ)، توزیع استاتوس و محصولات محبوب
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#D97706] hover:text-[#B45309] bg-[#FFFBEB] px-3.5 py-1.5 border border-[#FDE68A] transition-colors rounded-none"
            >
              مدیریت و پردازش سفارشات ({toPersianDigits(totalOrders)}) ←
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: 7-Day Daily Orders Bar Chart */}
          <div className="bg-white border border-[#D5C7B8] p-6 shadow-sm rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#D97706]" />
                <h3 className="text-sm font-black text-[#2B2017]">
                  روند ثبت سفارشات (۷ روز اخیر)
                </h3>
              </div>
              <span className="text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-none">
                مجموع: {toPersianDigits(total7DaysOrders)} سفارش
              </span>
            </div>

            {/* Dependency-Free Responsive SVG Bar Chart */}
            <div className="w-full overflow-hidden pt-2">
              <svg
                viewBox="0 0 540 170"
                className="w-full h-44 overflow-visible"
                aria-label="نمودار روند سفارشات ۷ روز اخیر"
              >
                {/* Horizontal Guide Grid Lines */}
                <line x1="30" y1="20" x2="520" y2="20" stroke="#F3EFEA" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="30" y1="60" x2="520" y2="60" stroke="#F3EFEA" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="30" y1="100" x2="520" y2="100" stroke="#F3EFEA" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="30" y1="135" x2="520" y2="135" stroke="#D5C7B8" strokeWidth="1.5" />

                {daysData.map((d, idx) => {
                  const barWidth = 36;
                  const x = 50 + idx * 68;
                  const barHeight = d.count > 0 ? Math.max(12, (d.count / maxDailyCount) * 105) : 4;
                  const y = 135 - barHeight;

                  return (
                    <g key={d.index} className="transition-all duration-300">
                      {/* Bar Background Hover Area */}
                      <rect
                        x={x - 4}
                        y="15"
                        width={barWidth + 8}
                        height="120"
                        fill="transparent"
                        className="hover:fill-amber-50/50"
                      />
                      {/* Bar Fill */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={d.isToday ? '#D97706' : d.count > 0 ? '#FBBF24' : '#E5E7EB'}
                        rx="0"
                        className="transition-all duration-500"
                      />
                      {/* Order Count Label Above Bar */}
                      {d.count > 0 && (
                        <text
                          x={x + barWidth / 2}
                          y={y - 5}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="bold"
                          fill={d.isToday ? '#B45309' : '#5C5248'}
                        >
                          {toPersianDigits(d.count)}
                        </text>
                      )}
                      {/* Day Name Label */}
                      <text
                        x={x + barWidth / 2}
                        y="152"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight={d.isToday ? 'bold' : 'normal'}
                        fill={d.isToday ? '#D97706' : '#5C5248'}
                      >
                        {d.dayNameFa}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex items-center justify-between text-xs text-[#5C5248] pt-2 border-t border-[#EFE9E0]">
              <span>مجموع ارزش سفارش‌های ثبت‌شده در این بازه:</span>
              <span className="font-bold text-[#2B2017]">
                {toPersianDigits(total7DaysRevenue.toLocaleString('fa-IR'))} تومان
              </span>
            </div>
          </div>

          {/* Chart 2: Order Status Distribution */}
          <div className="bg-white border border-[#D5C7B8] p-6 shadow-sm rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D97706]" />
                <h3 className="text-sm font-black text-[#2B2017]">
                  چرخه و وضعیت سفارشات (Order Status Pipeline)
                </h3>
              </div>
              <span className="text-xs font-bold text-[#5C5248]">
                کل: {toPersianDigits(totalOrdersForBreakdown)} سفارش
              </span>
            </div>

            {/* Horizontal Distribution Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-5 bg-[#F3EFEA] flex overflow-hidden border border-[#D5C7B8] rounded-none">
                {totalOrdersForBreakdown === 0 ? (
                  <div className="w-full h-full bg-stone-200 text-center text-[11px] text-stone-500 flex items-center justify-center font-bold">
                    هنوز هیچ سفارشی در سامانه ثبت نشده است
                  </div>
                ) : (
                  <>
                    {statusCounts.NEW > 0 && (
                      <div
                        style={{ width: `${(statusCounts.NEW / totalOrdersForBreakdown) * 100}%` }}
                        className="h-full bg-rose-500 transition-all duration-500"
                        title={`جدید: ${statusCounts.NEW} (${statusPercentages.NEW}%)`}
                      />
                    )}
                    {statusCounts.CONTACTED > 0 && (
                      <div
                        style={{ width: `${(statusCounts.CONTACTED / totalOrdersForBreakdown) * 100}%` }}
                        className="h-full bg-[#D97706] transition-all duration-500"
                        title={`هماهنگ شده: ${statusCounts.CONTACTED} (${statusPercentages.CONTACTED}%)`}
                      />
                    )}
                    {statusCounts.SHIPPED > 0 && (
                      <div
                        style={{ width: `${(statusCounts.SHIPPED / totalOrdersForBreakdown) * 100}%` }}
                        className="h-full bg-emerald-600 transition-all duration-500"
                        title={`ارسال شده: ${statusCounts.SHIPPED} (${statusPercentages.SHIPPED}%)`}
                      />
                    )}
                    {statusCounts.CANCELLED > 0 && (
                      <div
                        style={{ width: `${(statusCounts.CANCELLED / totalOrdersForBreakdown) * 100}%` }}
                        className="h-full bg-stone-400 transition-all duration-500"
                        title={`لغو شده: ${statusCounts.CANCELLED} (${statusPercentages.CANCELLED}%)`}
                      />
                    )}
                  </>
                )}
              </div>
              <div className="flex justify-between text-[11px] text-[#8C7E72]">
                <span>توزیع نسبی مراحل سفارش</span>
                <span>۱۰۰٪ کل پایگاه داده</span>
              </div>
            </div>

            {/* Status Breakdown Cards */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-none flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-rose-500 inline-block rounded-none" />
                    <span>جدید (در انتظار)</span>
                  </div>
                  <div className="text-[11px] text-rose-700 mt-0.5">نیازمند تماس تلفنی یا چت</div>
                </div>
                <div className="text-end">
                  <div className="text-base font-black text-rose-900">{toPersianDigits(statusCounts.NEW)}</div>
                  <div className="text-[10px] font-bold text-rose-600">%{toPersianDigits(statusPercentages.NEW)}</div>
                </div>
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-none flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#D97706] inline-block rounded-none" />
                    <span>هماهنگ شده</span>
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5">تایید نهایی مشتری</div>
                </div>
                <div className="text-end">
                  <div className="text-base font-black text-amber-900">{toPersianDigits(statusCounts.CONTACTED)}</div>
                  <div className="text-[10px] font-bold text-amber-600">%{toPersianDigits(statusPercentages.CONTACTED)}</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-none flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ارسال و تحویل</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">تحویل پست یا پیک</div>
                </div>
                <div className="text-end">
                  <div className="text-base font-black text-emerald-900">{toPersianDigits(statusCounts.SHIPPED)}</div>
                  <div className="text-[10px] font-bold text-emerald-600">%{toPersianDigits(statusPercentages.SHIPPED)}</div>
                </div>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-none flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-stone-700 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-stone-500" />
                    <span>لغو شده</span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">سفارشات ابطال شده</div>
                </div>
                <div className="text-end">
                  <div className="text-base font-black text-stone-800">{toPersianDigits(statusCounts.CANCELLED)}</div>
                  <div className="text-[10px] font-bold text-stone-500">%{toPersianDigits(statusPercentages.CANCELLED)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3: Top Ordered Products */}
          <div className="bg-white border border-[#D5C7B8] p-6 shadow-sm rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#D97706]" />
                <h3 className="text-sm font-black text-[#2B2017]">
                  پرفروش‌ترین محصولات عسل (Top Ordered Products)
                </h3>
              </div>
              <Link
                href="/admin/products"
                className="text-xs font-bold text-[#D97706] hover:underline"
              >
                کاتالوگ محصولات ←
              </Link>
            </div>

            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#5C5248] border border-dashed border-[#D5C7B8] p-6 bg-[#FDFBF8] rounded-none">
                  هنوز سفارشی برای رتبه‌بندی محصولات در فروشگاه ثبت نشده است.
                </div>
              ) : (
                topProducts.map((prod, idx) => {
                  const pct = Math.round((prod.totalQty / maxTopQty) * 100);
                  return (
                    <div
                      key={prod.name}
                      className="p-3 bg-[#FDFBF8] border border-[#EFE9E0] space-y-2 rounded-none hover:border-[#D97706] transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 flex items-center justify-center text-[10px] font-black rounded-none ${
                              idx === 0
                                ? 'bg-[#D97706] text-white'
                                : idx === 1
                                ? 'bg-[#FBBF24] text-[#332115]'
                                : idx === 2
                                ? 'bg-stone-300 text-stone-800'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {(idx + 1).toLocaleString('fa-IR')}
                          </span>
                          <span className="font-bold text-[#2B2017]">{prod.name}</span>
                          {prod.sampleOption && (
                            <span className="text-[11px] text-[#8C7E72] hidden sm:inline">
                              ({prod.sampleOption})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="font-black text-[#D97706]">
                            {prod.totalQty.toLocaleString('fa-IR')}
                          </span>
                          <span className="text-[11px] text-[#5C5248]">عدد / شیشه</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-stone-200 overflow-hidden rounded-none">
                        <div
                          className="h-full bg-[#D97706] transition-all duration-500 rounded-none"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chart 4: Customer Contact Channels */}
          <div className="bg-white border border-[#D5C7B8] p-6 shadow-sm rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#D97706]" />
                <h3 className="text-sm font-black text-[#2B2017]">
                  سهم پیام‌رسان‌ها و ترجیحات ارتباطی (Messenger Funnel)
                </h3>
              </div>
              <span className="text-xs font-bold text-[#5C5248]">
                مبنا: سفارشات ثبت‌شده
              </span>
            </div>

            <div className="space-y-2.5">
              {channelsMeta.map((ch) => {
                const pct =
                  totalChannelsCount > 0
                    ? Math.round((ch.count / totalChannelsCount) * 100)
                    : 0;

                return (
                  <div
                    key={ch.key}
                    className={`p-3 ${ch.bgClass} border ${ch.borderClass} rounded-none space-y-1.5`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-none shrink-0"
                          style={{ backgroundColor: ch.color }}
                        />
                        <span className="font-bold text-[#2B2017]">{ch.nameFa}</span>
                        <span className="text-[10px] text-[#8C7E72] font-mono">({ch.latinName})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="font-black text-[#2B2017]">{toPersianDigits(ch.count)} سفارش</span>
                        <span className="text-[10px] font-bold text-[#5C5248]">%{toPersianDigits(pct)}</span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-black/5 overflow-hidden rounded-none">
                      <div
                        className="h-full transition-all duration-500 rounded-none"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: ch.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* PRIORITY 1: Bot Notification Health & Recent Dispatch Monitoring */}
      <div className="bg-white border border-[#D5C7B8] p-6 shadow-sm rounded-none space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFE9E0] pb-3">
          <div>
            <h2 className="text-base font-black text-[#2B2017] flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#D97706]" />
              <span>مانیتورینگ ارسال اعلان ربات‌ها به ادمین (Order Bot Dispatch & Retry)</span>
            </h2>
            <p className="text-xs text-[#5C5248] mt-0.5">
              وضعیت اعلان‌های ارسال‌شده به تلگرام، بله یا ایتا برای سفارش‌های اخیر با امکان ارسال مجدد
            </p>
          </div>
          <span className="text-xs font-bold text-[#5C5248]">
            کانال‌های فعال: {systemHealth.bots.bale.isConfigured ? 'بله ' : ''}{systemHealth.bots.eitaa.isConfigured ? 'ایتا ' : ''}{!systemHealth.bots.bale.isConfigured && !systemHealth.bots.eitaa.isConfigured ? 'هیچ رباتی تنظیم نشده' : ''}
          </span>
        </div>

        {recentOrdersNeedingNotice.length === 0 ? (
          <div className="p-4 bg-[#FDFBF8] text-center text-xs text-[#5C5248] border border-dashed border-[#D5C7B8]">
            هنوز سفارشی ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EFE9E0] text-[#5C5248] bg-[#FDFBF8]">
                  <th className="py-2.5 px-3 text-start">کد سفارش</th>
                  <th className="py-2.5 px-3 text-start">مشتری</th>
                  <th className="py-2.5 px-3 text-start">کانال سفارش</th>
                  <th className="py-2.5 px-3 text-start">زمان ثبت</th>
                  <th className="py-2.5 px-3 text-start">عملیات اعلان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9E0]">
                {recentOrdersNeedingNotice.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FFFBEB]/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#D97706]">
                      {order.code}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#332115]">
                      {order.customerName} ({toPersianDigits(order.customerMobile)})
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#5C5248]">
                      {order.channelType || 'WEB'}
                    </td>
                    <td className="py-2.5 px-3 text-[#5C5248]" dir="ltr">
                      {new Date(order.createdAt).toLocaleString('fa-IR')}
                    </td>
                    <td className="py-2.5 px-3">
                      <ResendOrderNotificationButton orderId={order.id} orderCode={order.code} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRIORITY 2: Customer Demand & Loyalty Analysis (Top Cities & Repeat Customers) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Demand Cities */}
        <div className="bg-white border border-[#D5C7B8] p-6 shadow-sm rounded-none space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D97706]" />
              <h3 className="text-sm font-black text-[#2B2017]">
                شهرهای با بیشترین تقاضا (Top-Demand Cities)
              </h3>
            </div>
            <span className="text-xs font-bold text-[#5C5248]">
              {topCities.length} شهر برتر
            </span>
          </div>

          {topCities.length === 0 ? (
            <p className="text-xs text-[#5C5248] py-4 text-center">شهری در سفارشات ثبت نشده است.</p>
          ) : (
            <div className="space-y-2">
              {topCities.map((item, idx) => (
                <div key={item.city} className="flex items-center justify-between p-2.5 bg-[#FDFBF8] border border-[#EFE9E0] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-[10px]">
                      {toPersianDigits(idx + 1)}
                    </span>
                    <span className="font-bold text-[#332115]">{item.city}</span>
                  </div>
                  <span className="font-mono font-bold text-[#D97706]">
                    {toPersianDigits(item.count)} سفارش
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loyal Repeat Customers */}
        <div className="bg-white border border-[#D5C7B8] p-6 shadow-sm rounded-none space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#3F8F3B]" />
              <h3 className="text-sm font-black text-[#2B2017]">
                مشتریان وفادار (Repeat Customers)
              </h3>
            </div>
            <span className="text-xs font-bold text-[#5C5248]">
              بیش از ۱ خرید
            </span>
          </div>

          {loyalCustomers.length === 0 ? (
            <p className="text-xs text-[#5C5248] py-4 text-center">هنوز مشتری با سفارش تکراری ثبت نشده است.</p>
          ) : (
            <div className="space-y-2">
              {loyalCustomers.map((cust) => (
                <div key={cust.mobile} className="flex items-center justify-between p-2.5 bg-[#FDFBF8] border border-[#EFE9E0] text-xs">
                  <div>
                    <div className="font-bold text-[#332115]">{cust.name}</div>
                    <div className="text-[11px] text-[#5C5248] font-mono mt-0.5">{toPersianDigits(cust.mobile)}</div>
                  </div>
                  <div className="text-end">
                    <div className="font-bold text-[#3F8F3B]">{toPersianDigits(cust.orderCount)} سفارش</div>
                    <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                      {toPersianDigits(cust.totalSpent.toLocaleString('fa-IR'))} ت
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PRIORITY 2: Catalog Quality Control (QC Alert Box) */}
      <div className="bg-white border border-[#D5C7B8] p-6 shadow-sm rounded-none space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#D97706]" />
            <h3 className="text-sm font-black text-[#2B2017]">
              کنترل کیفیت کاتالوگ و محصولات ناقص (Catalog Quality Control)
            </h3>
          </div>
          <Link href="/admin/products" className="text-xs font-bold text-[#D97706] hover:underline">
            مدیریت محصولات ←
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Missing Image */}
          <div className={`p-4 border rounded-none ${productsMissingImage.length > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-emerald-50/70 border-emerald-300'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#2B2017]">فاقد تصویر شاخص</span>
              <span className={`text-base font-black ${productsMissingImage.length > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                {toPersianDigits(productsMissingImage.length)}
              </span>
            </div>
            <p className="text-[11px] text-[#5C5248] mt-1">
              {productsMissingImage.length > 0
                ? `${toPersianDigits(productsMissingImage.length)} محصول نیاز به بارگذاری تصویر اصلی دارند.`
                : 'تمام محصولات دارای تصویر شاخص هستند.'}
            </p>
          </div>

          {/* Missing Pricing Options */}
          <div className={`p-4 border rounded-none ${productsMissingOptions.length > 0 ? 'bg-rose-50/70 border-rose-300' : 'bg-emerald-50/70 border-emerald-300'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#2B2017]">فاقد گزینه وزن/قیمت</span>
              <span className={`text-base font-black ${productsMissingOptions.length > 0 ? 'text-rose-800' : 'text-emerald-800'}`}>
                {toPersianDigits(productsMissingOptions.length)}
              </span>
            </div>
            <p className="text-[11px] text-[#5C5248] mt-1">
              {productsMissingOptions.length > 0
                ? `${toPersianDigits(productsMissingOptions.length)} محصول فاقد پکیج و قیمت جهت خرید هستند.`
                : 'تمام محصولات دارای گزینه‌های قیمت‌گذاری هستند.'}
            </p>
          </div>

          {/* Unavailable Products */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#2B2017]">کالاهای ناموجود در انبار</span>
              <span className="text-base font-black text-stone-700">
                {toPersianDigits(productsUnavailable.length)}
              </span>
            </div>
            <p className="text-[11px] text-[#5C5248] mt-1">
              {productsUnavailable.length > 0
                ? `${toPersianDigits(productsUnavailable.length)} محصول فعال اما با وضعیت ناموجود در سایت.`
                : 'هیچ محصول فعالی ناموجود نیست.'}
            </p>
          </div>
        </div>
      </div>

      {/* Catalog Health & Stock Metrics Section */}
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
              %{toPersianDigits(stockRatio)}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-[#5C5248]">
            <span>موجود در انبار: {toPersianDigits(inStockProducts)} قلم</span>
            <span>ناموجود: {toPersianDigits(outOfStockProducts)} قلم</span>
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
              <div className="text-[11px] text-[#5C5248] mt-0.5">{toPersianDigits(inStockProducts)} محصول آماده خرید آنلاین</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#FDFBF8] border border-[#EFE9E0]">
            <AlertTriangle className={`w-5 h-5 shrink-0 ${outOfStockProducts > 0 ? 'text-rose-600' : 'text-stone-400'}`} />
            <div>
              <div className="text-xs font-bold text-[#2B2017]">محصولات ناموجود</div>
              <div className="text-[11px] text-[#5C5248] mt-0.5">
                {outOfStockProducts > 0 ? `${toPersianDigits(outOfStockProducts)} محصول نیازمند شارژ انبار` : 'هیچ محصولی ناموجود نیست'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#FDFBF8] border border-[#EFE9E0]">
            <Package className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-[#2B2017]">محصولات ویژه صفحه اصلی</div>
              <div className="text-[11px] text-[#5C5248] mt-0.5">{toPersianDigits(featuredProducts)} محصول دارای نشان ویژه</div>
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

      {/* PRIORITY 2: Last 10 Audit Entries (Enhanced Audit Trail Table) */}
      <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-base font-bold text-[#332115]">{uiStringsFa.adminDashboard.recentAuditLogs}</h2>
          </div>
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
                recentAuditLogs.map((log: any) => (
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
