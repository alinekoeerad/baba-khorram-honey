import React from 'react';
import Link from 'next/link';
import { db, OrderRecord } from '@/server/db/client';
import { getRecentAuditLogs } from '@/server/services/audit-log-service';
import { uiStringsFa } from '@/content/ui-strings.fa';
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
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Query orders, status counts & catalog health metrics
  const [
    rawOrders,
    totalOrders,
    newOrders,
    contactedOrders,
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
    db.order.findMany({ orderBy: { createdAt: 'desc' } }),
    db.order.count(),
    db.order.count({ where: { status: 'NEW' } }),
    db.order.count({ where: { status: 'CONTACTED' } }),
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

  const allOrders: OrderRecord[] = (rawOrders || []) as OrderRecord[];

  const stockRatio = publishedProducts > 0
    ? Math.round((inStockProducts / publishedProducts) * 100)
    : 100;

  // 1. Calculate Daily Orders & Revenue over the last 7 days
  const now = new Date();
  const daysData = Array.from({ length: 7 }, (_, i) => {
    // 0 is 6 days ago, 6 is today
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

  // 2. Order Status Breakdown
  const statusCounts = {
    NEW: allOrders.filter((o: OrderRecord) => o.status === 'NEW').length,
    CONTACTED: allOrders.filter((o: OrderRecord) => o.status === 'CONTACTED').length,
    SHIPPED: allOrders.filter((o: OrderRecord) => o.status === 'SHIPPED').length,
    CANCELLED: allOrders.filter((o: OrderRecord) => o.status === 'CANCELLED').length,
  };
  const totalOrdersForBreakdown = allOrders.length;
  const statusPercentages = {
    NEW: totalOrdersForBreakdown > 0 ? Math.round((statusCounts.NEW / totalOrdersForBreakdown) * 100) : 0,
    CONTACTED: totalOrdersForBreakdown > 0 ? Math.round((statusCounts.CONTACTED / totalOrdersForBreakdown) * 100) : 0,
    SHIPPED: totalOrdersForBreakdown > 0 ? Math.round((statusCounts.SHIPPED / totalOrdersForBreakdown) * 100) : 0,
    CANCELLED: totalOrdersForBreakdown > 0 ? Math.round((statusCounts.CANCELLED / totalOrdersForBreakdown) * 100) : 0,
  };

  // 3. Top Ordered Products
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

  // 4. Customer Contact Channels
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
            href="/admin/orders"
            className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-black transition-colors shadow-xs rounded-none"
          >
            مدیریت سفارشات ({newOrders})
          </Link>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] text-xs font-bold transition-colors shadow-xs rounded-none"
          >
            + محصول جدید
          </Link>
          <Link
            href="/admin/recipes/new"
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-[#2B2017] text-xs font-bold border border-[#EFE9E0] transition-colors rounded-none"
          >
            + دستور جدید
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {/* Orders Card */}
        <div className="bg-white border-2 border-[#FDE68A] p-6 shadow-xs relative overflow-hidden rounded-none">
          {newOrders > 0 && (
            <div className="absolute top-0 end-0 bg-rose-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-none animate-pulse">
              {newOrders} جدید
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wide flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-[#D97706]" />
              <span>سفارشات ثبت‌شده</span>
            </span>
            <span className="text-2xl font-black text-[#332115]">{totalOrders}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-[#EFE9E0] grid grid-cols-2 gap-2 text-center text-xs">
            <div>
              <div className="font-bold text-rose-600">{newOrders}</div>
              <div className="text-[#5C5248] text-[11px] mt-0.5">در انتظار هماهنگی</div>
            </div>
            <div>
              <div className="font-bold text-[#3F8F3B]">{contactedOrders}</div>
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
        {/* Products Card */}
        <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs rounded-none">
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
        <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs rounded-none">
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
        <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs rounded-none">
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
        <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9E3556] uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#9E3556]" />
              <span>بازخوردها و پیام‌ها</span>
            </span>
            <span className="text-2xl font-black text-[#332115] flex items-center gap-1.5">
              {unreadFeedbacks > 0 && (
                <span className="w-2.5 h-2.5 rounded-none bg-rose-500 animate-ping inline-block" />
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

      {/* Store Monitoring & Analytics Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D5C7B8] pb-3">
          <div>
            <h2 className="text-lg font-black text-[#2B2017] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D97706]" />
              <span>مانیتورینگ و آمار عملکرد فروشگاه (Store Monitoring & Analytics)</span>
            </h2>
            <p className="text-xs text-[#5C5248] mt-0.5">
              روند ثبت روزانه، وضعیت چرخه سفارش، محصولات پرتقاضا و ترجیحات ارتباطی مشتریان
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#D97706] hover:text-[#B45309] bg-[#FFFBEB] px-3.5 py-1.5 border border-[#FDE68A] transition-colors rounded-none"
            >
              مدیریت و پردازش سفارشات ({totalOrders}) ←
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
                مجموع: {total7DaysOrders} سفارش
              </span>
            </div>

            {/* Dependency-Free Responsive SVG Bar Chart */}
            <div className="w-full overflow-hidden pt-2">
              <svg
                viewBox="0 0 540 170"
                className="w-full h-44 overflow-visible"
                aria-label="نمودار روند سفارشات ۷ روز اخیر"
              >
                {/* Horizontal grid lines & Y labels */}
                {[0, 1, 2, 3, 4].map((step) => {
                  const yVal = 130 - (step / 4) * 105;
                  const labelVal = Math.round((step / 4) * maxDailyCount);
                  return (
                    <g key={step}>
                      <line
                        x1="45"
                        y1={yVal}
                        x2="525"
                        y2={yVal}
                        stroke="#EFE9E0"
                        strokeWidth="1"
                        strokeDasharray={step > 0 ? '3 3' : undefined}
                      />
                      <text
                        x="35"
                        y={yVal + 3}
                        textAnchor="end"
                        fontSize="10"
                        fill="#8C7E72"
                        fontFamily="inherit"
                      >
                        {labelVal.toLocaleString('fa-IR')}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {daysData.map((d, i) => {
                  const colWidth = (525 - 50) / 7;
                  const barWidth = 32;
                  const x = 50 + i * colWidth + (colWidth - barWidth) / 2;
                  const barH = d.count > 0 ? Math.max((d.count / maxDailyCount) * 105, 8) : 0;
                  const y = 130 - barH;

                  return (
                    <g key={d.index} className="group">
                      {/* Hover area */}
                      <rect
                        x={50 + i * colWidth + 2}
                        y="20"
                        width={colWidth - 4}
                        height="110"
                        fill="currentColor"
                        className="text-stone-100/0 hover:text-stone-100/60 transition-colors"
                      />

                      {/* Bar */}
                      {d.count > 0 ? (
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barH}
                          fill={d.isToday ? '#D97706' : '#F59E0B'}
                          className="transition-all duration-300 hover:brightness-110"
                          stroke={d.isToday ? '#B45309' : '#D97706'}
                          strokeWidth="1"
                        />
                      ) : (
                        <rect
                          x={x + barWidth / 2 - 8}
                          y={128}
                          width="16"
                          height="2"
                          fill="#D5C7B8"
                        />
                      )}

                      {/* Count label above bar */}
                      {d.count > 0 && (
                        <text
                          x={x + barWidth / 2}
                          y={y - 6}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="bold"
                          fill="#2B2017"
                          fontFamily="inherit"
                        >
                          {d.count.toLocaleString('fa-IR')}
                        </text>
                      )}

                      {/* Day name label */}
                      <text
                        x={x + barWidth / 2}
                        y="146"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight={d.isToday ? '900' : '600'}
                        fill={d.isToday ? '#D97706' : '#2B2017'}
                        fontFamily="inherit"
                      >
                        {d.dayNameFa}
                      </text>

                      {/* Short date label */}
                      <text
                        x={x + barWidth / 2}
                        y="160"
                        textAnchor="middle"
                        fontSize="9"
                        fill="#8C7E72"
                        fontFamily="inherit"
                      >
                        {d.dateFa}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* 7-Day Summary Badges */}
            <div className="pt-3 border-t border-[#EFE9E0] grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-[#FDFBF8] border border-[#EFE9E0] rounded-none">
                <div className="text-[11px] text-[#5C5248]">ثبت سفارش هفته</div>
                <div className="font-bold text-[#D97706] mt-0.5">{total7DaysOrders} سفارش</div>
              </div>
              <div className="p-2 bg-[#FDFBF8] border border-[#EFE9E0] rounded-none">
                <div className="text-[11px] text-[#5C5248]">مجموع ارزش ۷ روز</div>
                <div className="font-bold text-[#2B2017] mt-0.5">
                  {total7DaysRevenue > 0
                    ? `${total7DaysRevenue.toLocaleString('fa-IR')} ت`
                    : 'محاسبه در فاکتور'}
                </div>
              </div>
              <div className="p-2 bg-[#FDFBF8] border border-[#EFE9E0] rounded-none">
                <div className="text-[11px] text-[#5C5248]">میانگین روزانه</div>
                <div className="font-bold text-[#2B2017] mt-0.5">
                  {(total7DaysOrders / 7).toFixed(1)} / روز
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2: Order Status Breakdown */}
          <div className="bg-white border border-[#D5C7B8] p-6 shadow-sm rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D97706]" />
                <h3 className="text-sm font-black text-[#2B2017]">
                  وضعیت سفارشات (Order Status Breakdown)
                </h3>
              </div>
              <span className="text-xs font-bold text-[#5C5248]">
                کل: {totalOrdersForBreakdown} سفارش
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
              {/* NEW */}
              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-none flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-rose-500 inline-block rounded-none" />
                    <span>جدید (در انتظار)</span>
                  </div>
                  <div className="text-[11px] text-rose-700 mt-0.5">نیازمند تماس تلفنی یا چت</div>
                </div>
                <div className="text-end">
                  <div className="text-base font-black text-rose-900">{statusCounts.NEW}</div>
                  <div className="text-[10px] font-bold text-rose-600">%{statusPercentages.NEW}</div>
                </div>
              </div>

              {/* CONTACTED */}
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-none flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#D97706] inline-block rounded-none" />
                    <span>هماهنگ شده</span>
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5">تایید نهایی مشتری</div>
                </div>
                <div className="text-end">
                  <div className="text-base font-black text-amber-900">{statusCounts.CONTACTED}</div>
                  <div className="text-[10px] font-bold text-amber-600">%{statusPercentages.CONTACTED}</div>
                </div>
              </div>

              {/* SHIPPED */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-none flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ارسال و تحویل</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">تحویل پست یا پیک</div>
                </div>
                <div className="text-end">
                  <div className="text-base font-black text-emerald-900">{statusCounts.SHIPPED}</div>
                  <div className="text-[10px] font-bold text-emerald-600">%{statusPercentages.SHIPPED}</div>
                </div>
              </div>

              {/* CANCELLED */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-none flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-stone-700 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-stone-500" />
                    <span>لغو شده</span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">سفارشات ابطال شده</div>
                </div>
                <div className="text-end">
                  <div className="text-base font-black text-stone-800">{statusCounts.CANCELLED}</div>
                  <div className="text-[10px] font-bold text-stone-500">%{statusPercentages.CANCELLED}</div>
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
                      {/* Visual progress bar */}
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
                  کانال‌های ارتباطی ترجیحی مشتریان (Customer Contact Channels)
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
                        <span className="font-black text-[#2B2017]">{ch.count} سفارش</span>
                        <span className="text-[10px] font-bold text-[#5C5248]">%{pct}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
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
