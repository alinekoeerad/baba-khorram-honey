'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/server/auth/require-admin';
import {
  createFaqSchema,
  updateFaqSchema,
  reorderFaqsSchema,
} from '@/server/validation/faq-schemas';
import {
  createFaqItem,
  updateFaqItem,
  deleteFaqItem,
  reorderFaqItems,
  toggleFaqPublishStatus,
} from '@/server/services/faq-service';

export async function createFaqAction(rawInput: unknown) {
  try {
    const admin = await requireAdmin();
    const validated = createFaqSchema.parse(rawInput);
    const data = await createFaqItem(validated, admin.user.id);

    revalidatePath('/faq');
    revalidatePath('/');
    return { success: true, data };
  } catch (err: any) {
    console.error('createFaqAction error:', err);
    return { success: false, error: err.message || 'خطا در ایجاد پرسش متداول.' };
  }
}

export async function updateFaqAction(id: string, rawInput: unknown) {
  try {
    const admin = await requireAdmin();
    const rawObj = rawInput && typeof rawInput === 'object' ? rawInput : {};
    const validated = updateFaqSchema.parse({ ...rawObj, id });
    const data = await updateFaqItem(id, validated, admin.user.id);

    revalidatePath('/faq');
    revalidatePath('/');
    return { success: true, data };
  } catch (err: any) {
    console.error('updateFaqAction error:', err);
    return { success: false, error: err.message || 'خطا در ویرایش پرسش متداول.' };
  }
}

export async function deleteFaqAction(id: string) {
  try {
    const admin = await requireAdmin();
    if (!id) throw new Error('شناسه نامعتبر است.');
    const data = await deleteFaqItem(id, admin.user.id);

    revalidatePath('/faq');
    revalidatePath('/');
    return { success: true, data };
  } catch (err: any) {
    console.error('deleteFaqAction error:', err);
    return { success: false, error: err.message || 'خطا در حذف پرسش متداول.' };
  }
}

export async function reorderFaqsAction(rawInput: unknown) {
  try {
    const admin = await requireAdmin();
    const validated = reorderFaqsSchema.parse(rawInput);
    await reorderFaqItems(validated.items, admin.user.id);

    revalidatePath('/faq');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('reorderFaqsAction error:', err);
    return { success: false, error: err.message || 'خطا در مرتب‌سازی پرسش‌های متداول.' };
  }
}

export async function toggleFaqPublishAction(id: string, isPublished: boolean) {
  try {
    const admin = await requireAdmin();
    if (!id) throw new Error('شناسه نامعتبر است.');
    const data = await toggleFaqPublishStatus(id, isPublished, admin.user.id);

    revalidatePath('/faq');
    revalidatePath('/');
    return { success: true, data };
  } catch (err: any) {
    console.error('toggleFaqPublishAction error:', err);
    return { success: false, error: err.message || 'خطا در تغییر وضعیت انتشار.' };
  }
}
