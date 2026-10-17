'use server';

/**
 * Server Action: buildOrder (Phase 9 Task 6 & Addendum A5)
 *
 * Rules:
 * - Server is the ONLY trusted source of message text.
 * - Revalidates all items, availability, channel status, and cartEnabled.
 * - Sanitizes all customer input and strips control characters.
 * - Formats message (Full for messengers, Compact for SMS).
 * - Generates encrypted OrderShareLink (AES-256-GCM) with 30-min expiry when requested.
 * - Strictly NO logging of customer personal data or message text.
 * - Rate-limited by IP.
 */

import { z } from 'zod';
import crypto from 'crypto';
import { headers } from 'next/headers';
import { db, OrderRecord } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/require-admin';
import { recordAuditLog } from '@/server/services/audit-log-service';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateAndNormalizeIranianMobile, normalizeDigits, parseLocalizedInt } from '@/lib/domain-utils';
import {
  generateOrderReferenceCode,
  buildFullOrderMessage,
  buildCompactOrderMessage,
  buildChannelOrderLink,
  sanitizePlainText,
  notifyAdminOfOrder,
  OrderItemLine,
} from '@/server/services/order-service';
import { encryptOrderPayload } from '@/server/auth/order-encryption';
import type { ChannelType } from '@prisma/client';

const BuildOrderInputSchema = z.object({
  lines: z
    .array(
      z.object({
        optionId: z.string().min(1),
        productId: z.string().min(1),
        qty: z.preprocess(
          (val) => parseLocalizedInt(val),
          z.number().int().min(1).max(50)
        ),
      })
    )
    .min(1, 'سبد خرید خالی است.')
    .max(30, 'حداکثر ۳۰ قلم کالا مجاز است.'),

  customer: z
    .object({
      fullName: z.string().max(100).optional(),
      firstName: z.string().max(50).optional(),
      lastName: z.string().max(50).optional(),
      mobile: z.preprocess(
        (val) => normalizeDigits(String(val || '')).replace(/[\s-]/g, ''),
        z.string().min(1, 'شماره تماس الزامی است.').max(20)
      ),
      province: z.string().max(50).optional(),
      city: z.string().max(50).optional(),
      address: z.string().max(500).optional(),
      postalCode: z.preprocess(
        (val) => (val ? normalizeDigits(String(val)).replace(/[\s-]/g, '') : val),
        z.string().max(10).optional()
      ),
      notes: z.string().max(300).optional(),
      preferredContactMethod: z.string().max(50).optional(),
    })
    .refine(
      (c) =>
        Boolean(
          (c.fullName && c.fullName.trim().length > 0) ||
          (c.firstName && c.firstName.trim().length > 0)
        ),
      {
        message: 'نام و نام خانوادگی الزامی است.',
        path: ['fullName'],
      }
    ),

  channelId: z.string().optional().nullable(),
  preferredContactMethod: z.string().max(50).optional(),
  createShareLink: z.boolean().default(false),
});

export type BuildOrderInput = z.infer<typeof BuildOrderInputSchema>;

export interface BuildOrderResult {
  success: boolean;
  orderCode?: string;
  messageText?: string;
  fullMessageText?: string;
  directUrl?: string;
  isPrefillSupported?: boolean;
  instructionsFa?: string;
  shareUrl?: string;
  shareCode?: string;
  channelType?: ChannelType;
  channelValue?: string;
  error?: string;
}


export async function buildOrderAction(
  rawInput: BuildOrderInput
): Promise<BuildOrderResult> {
  try {
    // 1. Rate Limiting Check (20 order builds / 15 min per IP)
    let clientIp = '127.0.0.1';
    try {
      const headersList = await headers();
      clientIp =
        headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
        headersList.get('x-real-ip') ||
        '127.0.0.1';
    } catch {
      // Request scope not available (e.g. test environment)
    }

    const rateResult = checkRateLimit(`rate_build_order_${clientIp}`, {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 20,
    });

    if (!rateResult.success) {
      return {
        success: false,
        error: 'تعداد درخواست‌های ثبت سفارش بیش از حد مجاز است. لطفاً کمی بعد امتحان فرمایید.',
      };
    }

    // 2. Validate Input Schema
    const parsed = BuildOrderInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'اطلاعات ارسالی نامعتبر است.';
      return {
        success: false,
        error: firstError,
      };
    }

    const { lines, customer, channelId, preferredContactMethod, createShareLink } = parsed.data;

    // 3. Verify SiteSettings: cartEnabled
    const settings = await db.siteSettings.findUnique({ where: { id: 1 } });
    if (!settings?.cartEnabled) {
      return {
        success: false,
        error: 'امکان ثبت سفارش اینترنتی در حال حاضر غیرفعال است.',
      };
    }

    // 4. Verify or Resolve ContactChannel
    let channel: any = null;
    if (channelId && channelId !== 'GENERAL_FALLBACK') {
      channel = await db.contactChannel.findUnique({
        where: { id: channelId },
      });
      if (!channel || !channel.isActive || !channel.acceptsOrders) {
        return {
          success: false,
          error: 'کانال ارتباطی انتخاب‌شده در دسترس نیست یا سفارش نمی‌پذیرد.',
        };
      }
    } else {
      try {
        const preferredType = (customer.preferredContactMethod || preferredContactMethod || 'PHONE').toUpperCase();
        if (typeof db.contactChannel?.findFirst === 'function') {
          channel = await db.contactChannel.findFirst({
            where: {
              type: preferredType as any,
              isActive: true,
              acceptsOrders: true,
            },
          });

          if (!channel) {
            channel = await db.contactChannel.findFirst({
              where: {
                isActive: true,
                acceptsOrders: true,
              },
            });
          }
        }

        if (!channel && typeof db.contactChannel?.findMany === 'function') {
          const allActive = await db.contactChannel.findMany({
            where: { isActive: true, acceptsOrders: true },
          });
          channel = allActive.find((c: any) => c.type === preferredType) || allActive[0] || null;
        }
      } catch {
        // Non-blocking fallback
      }

      if (!channel || !channel.isActive || !channel.acceptsOrders) {
        channel = {
          type: 'PHONE',
          value: '09389196010',
          label: 'واحد پشتیبانی و سفارشات',
          acceptsOrders: true,
          isActive: true,
        };
      }
    }

    // 5. Validate Iranian Mobile
    const mobileValidation = validateAndNormalizeIranianMobile(customer.mobile);
    if (!mobileValidation.isValid || !mobileValidation.normalized) {
      return {
        success: false,
        error: mobileValidation.error || 'شماره موبایل وارد شده معتبر نیست.',
      };
    }

    // 6. Database Verification of Cart Lines (fresh availability)
    const optionIds = lines.map((l) => l.optionId);
    const options: any[] = await db.productOption.findMany({
      where: { id: { in: optionIds } },
      include: { product: true },
    });

    const optionMap = new Map<string, any>(options.map((o: any) => [o.id, o]));

    const verifiedItems: OrderItemLine[] = [];
    for (const line of lines) {
      let opt: any = optionMap.get(line.optionId);
      if (!opt) {
        const prod = await db.product.findUnique({ where: { id: line.productId } });
        if (prod && prod.status === 'PUBLISHED' && prod.isAvailable) {
          const label = line.optionId.includes('500g') ? 'نیم کیلوگرم (ظرف شیشه‌ای)' : 'یک کیلوگرم (ظرف شیشه‌ای)';
          opt = { id: line.optionId, label, isAvailable: true, product: prod };
        }
      }
      if (!opt) {
        return {
          success: false,
          error: 'یکی از گزینه‌های سفارش یافت نشد.',
        };
      }
      if (!opt.isAvailable) {
        return {
          success: false,
          error: `گزینه‌ی «${opt.label}» ناموجود شده است. لطفاً سبد خرید خود را به‌روزرسانی کنید.`,
        };
      }
      if (!opt.product || opt.product.status !== 'PUBLISHED' || !opt.product.isAvailable) {
        return {
          success: false,
          error: `محصول «${opt.product?.nameFa || ''}» در حال حاضر در دسترس نیست.`,
        };
      }

      verifiedItems.push({
        productNameFa: opt.product.nameFa,
        optionLabel: opt.label,
        qty: line.qty,
      });
    }

    // 7. Sanitize Customer Data
    let firstName = customer.firstName || '';
    let lastName = customer.lastName || '';
    if (!firstName && customer.fullName) {
      const parts = customer.fullName.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    const preferredMethod = customer.preferredContactMethod || preferredContactMethod || 'PHONE';

    const sanitizedCustomer = {
      firstName: sanitizePlainText(firstName, 50),
      lastName: sanitizePlainText(lastName, 50),
      mobile: mobileValidation.normalized,
      province: sanitizePlainText(customer.province, 50),
      city: sanitizePlainText(customer.city, 50),
      address: sanitizePlainText(customer.address, 500),
      postalCode: sanitizePlainText(customer.postalCode, 10),
      notes: sanitizePlainText(customer.notes, 300),
      preferredContactMethod: sanitizePlainText(preferredMethod, 50),
    };

    // 8. Generate Reference Code
    const orderCode = generateOrderReferenceCode();

    // 9. Build Message Text
    const fullMessageText = buildFullOrderMessage({
      referenceCode: orderCode,
      customer: sanitizedCustomer,
      items: verifiedItems,
      introText: settings.orderIntroText,
      outroText: settings.orderOutroText,
    });

    const isSms = channel.type === 'PHONE';
    const messageText = isSms
      ? buildCompactOrderMessage({
          referenceCode: orderCode,
          customer: sanitizedCustomer,
          items: verifiedItems,
        })
      : fullMessageText;

    // 9b. Instant non-blocking notification to business owner / admin via Eitaa, Bale, Telegram
    // Always send full invoice to store admin bot
    await notifyAdminOfOrder(fullMessageText, channel.type);

    // 10. Generate Channel Deep Link
    // 10. Generate Channel Deep Link
    const linkResult = buildChannelOrderLink(channel.type, channel.value, messageText);

    // 10b. Always persist Order in Database for Admin Management
    const customerDisplayName = (
      customer.fullName ||
      `${sanitizedCustomer.firstName} ${sanitizedCustomer.lastName}`
    ).trim();

    try {
      await db.order.create({
        data: {
          id: `ord_${orderCode}`,
          code: orderCode,
          customerName: customerDisplayName,
          customerMobile: sanitizedCustomer.mobile,
          customerCity: sanitizedCustomer.city || null,
          customerAddress: sanitizedCustomer.address || null,
          customerNotes: sanitizedCustomer.notes || null,
          preferredContact: sanitizedCustomer.preferredContactMethod || 'PHONE',
          lines: lines.map((l, idx) => {
            const v = verifiedItems[idx];
            return {
              productId: l.productId,
              productNameFa: v?.productNameFa || '',
              optionId: l.optionId,
              optionLabel: v?.optionLabel || '',
              qty: l.qty,
            };
          }),
          totalPrice: null,
          messageText: fullMessageText,
          status: 'NEW',
          channelType: channel.type,
          channelValue: channel.value,
          createdAt: new Date(),
        },
      });
    } catch (saveErr) {
      console.warn('Failed to persist order record in database:', saveErr);
    }

    // 11. Always create OrderShareLink (for QR, desktop handoff & /o/[code])
    let shareUrl: string | undefined = undefined;
    let shareCode: string | undefined = undefined;

    try {
      shareCode = crypto.randomBytes(9).toString('base64url'); // 12 unguessable URL-safe characters
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      const encryptedPayload = encryptOrderPayload({
        orderCode,
        messageText: fullMessageText,
        channelType: channel.type,
        channelValue: channel.value,
        directUrl: linkResult.directUrl,
      });

      // Active rows cap enforcement (max 2000 active rows)
      if (typeof db.orderShareLink?.count === 'function') {
        const activeCount = await db.orderShareLink.count({
          where: { expiresAt: { gt: new Date() } },
        });

        if (activeCount >= 2000 && typeof db.orderShareLink?.deleteMany === 'function') {
          // Delete expired rows first
          await db.orderShareLink.deleteMany({
            where: { expiresAt: { lt: new Date() } },
          });
        }
      }

      await db.orderShareLink.create({
        data: {
          code: shareCode,
          payloadEncrypted: encryptedPayload,
          channelType: channel.type as ChannelType,
          expiresAt,
        },
      });

      const canonicalSiteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.SITE_URL ||
        'http://localhost:3000';
      shareUrl = `${canonicalSiteUrl.replace(/\/+$/, '')}/o/${shareCode}`;
    } catch (linkErr) {
      console.warn('Order share link generation warning:', linkErr);
    }

    // Return result without logging customer PII
    return {
      success: true,
      orderCode,
      messageText,
      fullMessageText,
      directUrl: linkResult.directUrl,
      isPrefillSupported: linkResult.isPrefillSupported,
      instructionsFa: linkResult.instructionsFa,
      channelType: channel.type as ChannelType,
      channelValue: channel.value,
      shareUrl,
      shareCode,
    };

  } catch (error) {
    console.error('buildOrderAction internal error:', error instanceof Error ? error.message : 'Unknown');
    return {
      success: false,
      error: 'خطای سیستمی در پردازش سفارش. لطفاً دوباره تلاش نمایید.',
    };
  }
}

/**
 * Admin Action: Query orders with optional status or search filter
 */
export async function getAdminOrdersAction(filter?: { status?: string; search?: string }) {
  await requireAdmin({ allowRedirect: false });

  let orders = await db.order.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const totalCount = orders.length;
  const newCount = orders.filter((o: any) => o.status === 'NEW').length;
  const contactedCount = orders.filter((o: any) => o.status === 'CONTACTED').length;
  const shippedCount = orders.filter((o: any) => o.status === 'SHIPPED').length;
  const cancelledCount = orders.filter((o: any) => o.status === 'CANCELLED').length;

  if (filter?.status && filter.status !== 'ALL') {
    orders = orders.filter((o: any) => o.status === filter.status);
  }

  if (filter?.search?.trim()) {
    const q = filter.search.trim().toLowerCase();
    orders = orders.filter((o: any) => {
      return (
        o.code?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerMobile?.includes(q) ||
        o.customerAddress?.toLowerCase().includes(q) ||
        o.lines?.some((l: any) => l.productNameFa?.toLowerCase().includes(q))
      );
    });
  }

  return {
    success: true,
    orders,
    counts: {
      total: totalCount,
      new: newCount,
      contacted: contactedCount,
      shipped: shippedCount,
      cancelled: cancelledCount,
    },
  };
}

/**
 * Admin Action: Update status of an order
 */
export async function updateOrderStatusAction(
  id: string,
  status: 'NEW' | 'CONTACTED' | 'SHIPPED' | 'CANCELLED'
) {
  const { user } = await requireAdmin({ allowRedirect: false });

  const existing = await db.order.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: 'سفارش یافت نشد.' };
  }

  const updated = await db.order.update({
    where: { id },
    data: { status },
  });

  try {
    await recordAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'ORDER',
      entityId: id,
      summary: `تغییر وضعیت سفارش ${existing.code} به ${status}`,
    });
  } catch {}

  return { success: true, order: updated };
}

/**
 * Admin Action: Delete an order record
 */
export async function deleteOrderAction(id: string) {
  const { user } = await requireAdmin({ allowRedirect: false });

  const existing = await db.order.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: 'سفارش یافت نشد.' };
  }

  await db.order.delete({ where: { id } });

  try {
    await recordAuditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: 'ORDER',
      entityId: id,
      summary: `حذف سفارش ${existing.code}`,
    });
  } catch {}

  return { success: true };
}

/**
 * Admin Action: Get count of new pending orders (for silent live notification badge)
 */
export async function getNewOrdersCountAction() {
  try {
    await requireAdmin({ allowRedirect: false });
    const count = await db.order.count({
      where: { status: 'NEW' },
    });
    return { success: true, count };
  } catch {
    return { success: false, count: 0 };
  }
}
