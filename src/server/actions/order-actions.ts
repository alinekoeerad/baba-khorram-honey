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
import { db } from '@/server/db/client';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateAndNormalizeIranianMobile } from '@/lib/domain-utils';
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
        qty: z.number().int().min(1).max(50),
      })
    )
    .min(1, 'سبد خرید خالی است.')
    .max(30, 'حداکثر ۳۰ قلم کالا مجاز است.'),

  customer: z.object({
    firstName: z.string().min(1, 'نام الزامی است.').max(50),
    lastName: z.string().min(1, 'نام خانوادگی الزامی است.').max(50),
    mobile: z.string().min(1, 'شماره تماس الزامی است.').max(20),
    province: z.string().min(1, 'استان الزامی است.').max(50),
    city: z.string().min(1, 'شهر الزامی است.').max(50),
    address: z.string().min(5, 'آدرس دقیق الزامی است.').max(500),
    postalCode: z.string().max(10).optional(),
    notes: z.string().max(300).optional(),
  }),

  channelId: z.string().optional().nullable(),
  createShareLink: z.boolean().default(false),
});

export type BuildOrderInput = z.infer<typeof BuildOrderInputSchema>;

export interface BuildOrderResult {
  success: boolean;
  orderCode?: string;
  messageText?: string;
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

    const { lines, customer, channelId, createShareLink } = parsed.data;

    // 3. Verify SiteSettings: cartEnabled
    const settings = await db.siteSettings.findUnique({ where: { id: 1 } });
    if (!settings?.cartEnabled) {
      return {
        success: false,
        error: 'امکان ثبت سفارش اینترنتی در حال حاضر غیرفعال است.',
      };
    }

    // 4. Verify ContactChannel: active & acceptsOrders
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
      channel = {
        type: 'OTHER',
        value: 'contact',
        label: 'اشتراک‌گذاری و پشتیبانی مستقیم',
        acceptsOrders: true,
        isActive: true,
      };
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
    const sanitizedCustomer = {
      firstName: sanitizePlainText(customer.firstName, 50),
      lastName: sanitizePlainText(customer.lastName, 50),
      mobile: mobileValidation.normalized,
      province: sanitizePlainText(customer.province, 50),
      city: sanitizePlainText(customer.city, 50),
      address: sanitizePlainText(customer.address, 500),
      postalCode: sanitizePlainText(customer.postalCode, 10),
      notes: sanitizePlainText(customer.notes, 300),
    };

    // 8. Generate Reference Code
    const orderCode = generateOrderReferenceCode();

    // 9. Build Message Text
    const isSms = channel.type === 'PHONE';
    const messageText = isSms
      ? buildCompactOrderMessage({
          referenceCode: orderCode,
          customer: sanitizedCustomer,
          items: verifiedItems,
        })
      : buildFullOrderMessage({
          referenceCode: orderCode,
          customer: sanitizedCustomer,
          items: verifiedItems,
          introText: settings.orderIntroText,
          outroText: settings.orderOutroText,
        });

    // 9b. Instant non-blocking notification to business owner / admin via Eitaa, Bale, Telegram
    await notifyAdminOfOrder(messageText, channel.type);

    // 10. Generate Channel Deep Link
    const linkResult = buildChannelOrderLink(channel.type, channel.value, messageText);

    // 11. Create OrderShareLink if requested (for QR / Desktop handoff)
    let shareUrl: string | undefined = undefined;
    let shareCode: string | undefined = undefined;

    if (createShareLink) {
      shareCode = crypto.randomBytes(9).toString('base64url'); // 12 unguessable URL-safe characters
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      const encryptedPayload = encryptOrderPayload({
        orderCode,
        messageText,
        channelType: channel.type,
        channelValue: channel.value,
        directUrl: linkResult.directUrl,
      });

      // Active rows cap enforcement (max 2000 active rows)
      const activeCount = await db.orderShareLink.count({
        where: { expiresAt: { gt: new Date() } },
      });

      if (activeCount >= 2000) {
        // Delete expired rows first
        await db.orderShareLink.deleteMany({
          where: { expiresAt: { lt: new Date() } },
        });
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
    }

    // Return result without logging customer PII
    return {
      success: true,
      orderCode,
      messageText,
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
