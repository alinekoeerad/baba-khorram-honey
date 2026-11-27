'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/server/auth/require-admin';
import {
  createMagazineArticleSchema,
  updateMagazineArticleSchema,
  reorderMagazineArticlesSchema,
} from '@/server/validation/magazine-schemas';
import {
  createMagazineArticle,
  updateMagazineArticle,
  deleteMagazineArticle,
  reorderMagazineArticles,
  toggleMagazineArticleStatus,
} from '@/server/services/magazine-service';

export async function createMagazineArticleAction(rawInput: unknown) {
  try {
    const admin = await requireAdmin();
    const validated = createMagazineArticleSchema.parse(rawInput);
    const data = await createMagazineArticle(validated, admin.user.id);

    revalidatePath('/magazine');
    revalidatePath(`/magazine/${data.slug}`);
    revalidatePath('/sitemap.xml');
    revalidatePath('/');
    return { success: true, data };
  } catch (err: any) {
    console.error('createMagazineArticleAction error:', err);
    return { success: false, error: err.message || 'خطا در ثبت مقاله مجله علمی.' };
  }
}

export async function updateMagazineArticleAction(id: string, rawInput: unknown) {
  try {
    const admin = await requireAdmin();
    const rawObj = rawInput && typeof rawInput === 'object' ? rawInput : {};
    const validated = updateMagazineArticleSchema.parse({ ...rawObj, id });
    const data = await updateMagazineArticle(id, validated, admin.user.id);

    revalidatePath('/magazine');
    revalidatePath(`/magazine/${data.slug}`);
    revalidatePath('/sitemap.xml');
    revalidatePath('/');
    return { success: true, data };
  } catch (err: any) {
    console.error('updateMagazineArticleAction error:', err);
    return { success: false, error: err.message || 'خطا در ویرایش مقاله مجله علمی.' };
  }
}

export async function deleteMagazineArticleAction(id: string) {
  try {
    const admin = await requireAdmin();
    if (!id) throw new Error('شناسه نامعتبر است.');
    const data = await deleteMagazineArticle(id, admin.user.id);

    revalidatePath('/magazine');
    revalidatePath('/sitemap.xml');
    revalidatePath('/');
    return { success: true, data };
  } catch (err: any) {
    console.error('deleteMagazineArticleAction error:', err);
    return { success: false, error: err.message || 'خطا در حذف مقاله مجله علمی.' };
  }
}

export async function toggleMagazineArticleStatusAction(
  id: string,
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
) {
  try {
    const admin = await requireAdmin();
    if (!id) throw new Error('شناسه نامعتبر است.');
    const data = await toggleMagazineArticleStatus(id, status, admin.user.id);

    revalidatePath('/magazine');
    revalidatePath('/sitemap.xml');
    revalidatePath('/');
    return { success: true, data };
  } catch (err: any) {
    console.error('toggleMagazineArticleStatusAction error:', err);
    return { success: false, error: err.message || 'خطا در تغییر وضعیت مقاله.' };
  }
}

export async function reorderMagazineArticlesAction(rawInput: unknown) {
  try {
    const admin = await requireAdmin();
    const validated = reorderMagazineArticlesSchema.parse(rawInput);
    await reorderMagazineArticles(validated.items, admin.user.id);

    revalidatePath('/magazine');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('reorderMagazineArticlesAction error:', err);
    return { success: false, error: err.message || 'خطا در مرتب‌سازی مقالات مجله علمی.' };
  }
}
