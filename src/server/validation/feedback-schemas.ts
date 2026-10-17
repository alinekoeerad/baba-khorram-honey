import { z } from 'zod';
import { normalizeDigits } from '@/lib/domain-utils';

export const feedbackTypeEnum = z.enum([
  'SUGGESTION',
  'CRITICISM',
  'PRODUCT_QUALITY',
  'OTHER',
]);

export const feedbackStatusEnum = z.enum([
  'UNREAD',
  'REVIEWED',
  'ARCHIVED',
]);

export const feedbackSubmissionSchema = z.object({
  name: z
    .string()
    .min(2, 'نام و نام خانوادگی باید حداقل ۲ نویسه باشد.')
    .max(100, 'نام و نام خانوادگی نمی‌تواند بیش از ۱۰۰ نویسه باشد.')
    .trim(),
  phone: z
    .string()
    .transform((val) => normalizeDigits(val).replace(/[\s-]/g, ''))
    .refine(
      (val) => /^(\+98|0)?9\d{9}$/.test(val) || /^(\+98|0)[1-8]\d{8,9}$/.test(val),
      'شماره تماس وارد شده معتبر نیست (مثال: 09123456789)'
    ),
  type: feedbackTypeEnum.default('SUGGESTION'),
  message: z
    .string()
    .min(10, 'متن پیام باید حداقل ۱۰ نویسه باشد.')
    .max(2000, 'متن پیام نمی‌تواند بیش از ۲۰۰۰ نویسه باشد.')
    .trim(),
  honeypot: z.string().max(0, 'درخواست غیرمجاز شناسایی شد.').optional(),
});

export const feedbackStatusUpdateSchema = z.object({
  id: z.string().min(1),
  status: feedbackStatusEnum,
  adminNote: z.string().max(1000).optional().nullable(),
  publicReply: z.string().max(2000).optional().nullable(),
});

export const trackFeedbackSchema = z.object({
  trackingCode: z
    .string()
    .transform((val) => normalizeDigits(val).trim().toUpperCase())
    .refine((val) => /^FB-\d+-[A-Z0-9]+$/i.test(val) || val.length >= 5, 'کد پیگیری نامعتبر است.'),
  phone: z
    .string()
    .transform((val) => normalizeDigits(val).replace(/[\s-]/g, ''))
    .refine(
      (val) => /^(\+98|0)?9\d{9}$/.test(val) || /^(\+98|0)[1-8]\d{8,9}$/.test(val),
      'شماره تماس وارد شده معتبر نیست (مثال: 09123456789)'
    ),
});

export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;
export type FeedbackStatusUpdateInput = z.infer<typeof feedbackStatusUpdateSchema>;
export type TrackFeedbackInput = z.infer<typeof trackFeedbackSchema>;
