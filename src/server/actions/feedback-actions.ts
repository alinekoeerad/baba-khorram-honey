/**
 * Feedback Server Actions
 * Handles public submissions with rate limiting & honeypot,
 * and admin management actions (list, update status, delete).
 */

'use server';

import crypto from 'crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/require-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { recordAuditLog } from '@/server/services/audit-log-service';
import {
  feedbackSubmissionSchema,
  feedbackStatusUpdateSchema,
  FeedbackSubmissionInput,
  FeedbackStatusUpdateInput,
} from '@/server/validation/feedback-schemas';

/**
 * Public action: Submit feedback or suggestion
 */
export async function submitFeedbackAction(input: FeedbackSubmissionInput) {
  // 1. Honeypot check
  if (input.honeypot && input.honeypot.trim().length > 0) {
    // Silently accept without saving to mislead automated bots
    return {
      success: true,
      trackingCode: 'FB-1405-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
    };
  }

  // 2. Validate input
  const parseResult = feedbackSubmissionSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || 'اطلاعات وارد شده معتبر نیست.',
    };
  }

  const validData = parseResult.data;

  // 3. Rate limiting per IP (5 submissions per hour)
  let ip = '127.0.0.1';
  try {
    const headersList = await headers();
    ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  } catch {}

  const rateLimitKey = `feedback:${ip}`;
  const rateLimitCheck = checkRateLimit(rateLimitKey, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 5,
  });

  if (!rateLimitCheck.success) {
    return {
      success: false,
      error: `تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً پس از ${Math.ceil((rateLimitCheck.retryAfterSec || 60) / 60)} دقیقه مجدداً تلاش نمایید.`,
    };
  }

  // 4. Generate unique tracking code (e.g. FB-1405-K8X29)
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, 5);
  const trackingCode = `FB-1405-${randomSuffix}`;

  // 5. Store in database
  const created = await db.feedback.create({
    data: {
      trackingCode,
      name: validData.name,
      phone: validData.phone,
      type: validData.type,
      message: validData.message,
      status: 'UNREAD',
      ip,
    },
  });

  return {
    success: true,
    trackingCode: created.trackingCode,
  };
}

/**
 * Admin action: Query feedbacks
 */
export async function getAdminFeedbacksAction(filter?: { status?: string; type?: string }) {
  await requireAdmin({ allowRedirect: false });

  const where: any = {};
  if (filter?.status && filter.status !== 'ALL') {
    where.status = filter.status;
  }
  if (filter?.type && filter.type !== 'ALL') {
    where.type = filter.type;
  }

  const feedbacks = await db.feedback.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const unreadCount = await db.feedback.count({
    where: { status: 'UNREAD' },
  });

  return {
    success: true,
    feedbacks,
    unreadCount,
  };
}

/**
 * Admin action: Update feedback status and internal notes
 */
export async function updateFeedbackStatusAction(input: FeedbackStatusUpdateInput) {
  const { user } = await requireAdmin({ allowRedirect: false });

  const parseResult = feedbackStatusUpdateSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || 'اطلاعات وارد شده نامعتبر است.',
    };
  }

  const { id, status, adminNote, publicReply } = parseResult.data;

  const updated = await db.feedback.update({
    where: { id },
    data: {
      status,
      adminNote: adminNote !== undefined ? adminNote : undefined,
      publicReply: publicReply !== undefined ? publicReply : undefined,
    },
  });

  await recordAuditLog({
    userId: user.id,
    action: 'FEEDBACK_UPDATE',
    entityType: 'Feedback',
    entityId: id,
    summary: `Feedback «${updated.trackingCode}» status updated to ${status} by admin «${user.name || user.email}»`,
  });

  revalidatePath('/admin/feedbacks');

  return {
    success: true,
    feedback: updated,
  };
}

/**
 * Public action: Track feedback status and read admin's public reply
 */
export async function trackFeedbackAction(input: import('@/server/validation/feedback-schemas').TrackFeedbackInput) {
  let ip = '127.0.0.1';
  try {
    const headersList = await headers();
    ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  } catch {}

  const rateLimitKey = `feedback-track:${ip}`;
  const rateLimitCheck = checkRateLimit(rateLimitKey, {
    windowMs: 10 * 60 * 1000,
    maxAttempts: 20,
  });

  if (!rateLimitCheck.success) {
    return {
      success: false,
      error: 'تعداد تلاش‌های پیگیری بیش از حد مجاز است. لطفاً چند دقیقه بعد امتحان فرمایید.',
    };
  }

  const { trackFeedbackSchema } = await import('@/server/validation/feedback-schemas');
  const parseResult = trackFeedbackSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || 'کد پیگیری یا شماره تماس نامعتبر است.',
    };
  }

  const { trackingCode, phone } = parseResult.data;
  const rawPhone = phone.replace(/^\+98/, '0').replace(/^9/, '09');

  const record = await db.feedback.findFirst({
    where: { trackingCode },
  });

  if (!record) {
    return {
      success: false,
      error: 'پیامی با این مشخصات یافت نشد. لطفاً کد پیگیری و شماره همراه را بررسی نمایید.',
    };
  }

  const recordPhone = record.phone.replace(/^\+98/, '0').replace(/^9/, '09');
  if (recordPhone !== rawPhone) {
    return {
      success: false,
      error: 'شماره همراه با کد پیگیری واردشده مطابقت ندارد.',
    };
  }

  return {
    success: true,
    data: {
      trackingCode: record.trackingCode,
      status: record.status,
      type: record.type,
      createdAt: record.createdAt,
      publicReply: record.publicReply || null,
    },
  };
}

/**
 * Admin action: Delete feedback
 */
export async function deleteFeedbackAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });

    const deleted = await db.feedback.delete({
      where: { id },
    });

    await recordAuditLog({
      userId: user.id,
      action: 'FEEDBACK_DELETE',
      entityType: 'Feedback',
      entityId: id,
      summary: `Feedback «${deleted.trackingCode}» removed by admin «${user.name || user.email}»`,
    });

    revalidatePath('/admin/feedbacks');

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'خطا در حذف پیام',
    };
  }
}
