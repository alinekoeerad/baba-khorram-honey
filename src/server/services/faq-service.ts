import { db } from '@/server/db/client';
import { FAQ_ENTRIES, FAQ_CATEGORIES, FaqEntry } from '@/content/faq-data';
import { recordAuditLog } from '@/server/services/audit-log-service';
import type { CreateFaqInput, UpdateFaqInput } from '@/server/validation/faq-schemas';

export interface FormattedFaqItem {
  id: string; // anchorId for anchor navigation
  dbId: string;
  question: string;
  shortAnswer: string;
  category: string;
  categoryLabel: string;
  featuredInNav: boolean;
  featuredOnHome: boolean;
  sortOrder: number;
  isPublished: boolean;
  blocks: any[];
  relatedArticleSlug?: string;
  relatedArticleLabel?: string;
}

function getCategoryLabel(catId: string, customLabel?: string | null): string {
  if (customLabel && customLabel.trim()) return customLabel.trim();
  const found = FAQ_CATEGORIES.find((c) => c.id === catId);
  return found ? found.label : catId;
}

export async function getPublicFaqItems(): Promise<FormattedFaqItem[]> {
  try {
    const rows = await db.faqItem.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (rows && rows.length > 0) {
      return rows.map((r: any) => {
        const extra = r.extraData as any;
        const blocks = Array.isArray(extra?.blocks) ? extra.blocks : [];
        return {
          id: r.anchorId,
          dbId: r.id,
          question: r.question,
          shortAnswer: r.answer,
          category: r.category,
          categoryLabel: getCategoryLabel(r.category, r.categoryLabel),
          featuredInNav: Boolean(r.featuredInNav),
          featuredOnHome: Boolean(r.featuredOnHome),
          sortOrder: r.sortOrder ?? 0,
          isPublished: Boolean(r.isPublished),
          blocks,
          relatedArticleSlug: r.relatedArticleSlug || undefined,
          relatedArticleLabel: r.relatedArticleLabel || undefined,
        };
      });
    }
  } catch (err) {
    console.warn('Failed to query faq items from db, falling back to static faq-data:', err);
  }

  // Fallback to static FAQ_ENTRIES
  return FAQ_ENTRIES.map((entry, idx) => ({
    id: entry.id,
    dbId: `static_${entry.id}`,
    question: entry.question,
    shortAnswer: entry.shortAnswer,
    category: entry.category,
    categoryLabel: entry.categoryLabel,
    featuredInNav: Boolean(entry.featuredInNav),
    featuredOnHome: Boolean(entry.featuredOnHome),
    sortOrder: idx,
    isPublished: true,
    blocks: entry.blocks,
    relatedArticleSlug: entry.relatedArticleSlug,
    relatedArticleLabel: entry.relatedArticleLabel,
  }));
}

export async function getAdminFaqItems(): Promise<any[]> {
  try {
    const rows = await db.faqItem.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    if (rows && rows.length > 0) {
      return rows;
    }
  } catch (err) {
    console.warn('Admin FAQ query error, falling back:', err);
  }

  // Fallback if empty in dev
  return FAQ_ENTRIES.map((entry, idx) => ({
    id: `faq_${entry.id}`,
    anchorId: entry.id,
    question: entry.question,
    answer: entry.shortAnswer,
    category: entry.category,
    categoryLabel: entry.categoryLabel,
    sortOrder: idx,
    isPublished: true,
    featuredInNav: Boolean(entry.featuredInNav),
    featuredOnHome: Boolean(entry.featuredOnHome),
    relatedArticleSlug: entry.relatedArticleSlug || null,
    relatedArticleLabel: entry.relatedArticleLabel || null,
    extraData: { blocks: entry.blocks },
    createdAt: new Date('2026-10-08T00:00:00.000Z'),
    updatedAt: new Date('2026-10-08T00:00:00.000Z'),
  }));
}

export async function getFaqItemById(id: string) {
  return db.faqItem.findUnique({
    where: { id },
  });
}

export async function createFaqItem(input: CreateFaqInput, adminUserId: string) {
  const existing = await db.faqItem.findUnique({
    where: { anchorId: input.anchorId },
  });
  if (existing) {
    throw new Error(`پرسشی با شناسه لنگر «${input.anchorId}» قبلاً ثبت شده است.`);
  }

  const categoryLabel = getCategoryLabel(input.category, input.categoryLabel);
  const created = await db.faqItem.create({
    data: {
      anchorId: input.anchorId,
      question: input.question,
      answer: input.answer,
      category: input.category,
      categoryLabel,
      sortOrder: input.sortOrder ?? 0,
      isPublished: input.isPublished ?? true,
      featuredInNav: Boolean(input.featuredInNav),
      featuredOnHome: Boolean(input.featuredOnHome),
      relatedArticleSlug: input.relatedArticleSlug || null,
      relatedArticleLabel: input.relatedArticleLabel || null,
      extraData: { blocks: input.blocks || [] },
    },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: 'CREATE',
    entityType: 'FaqItem',
    entityId: created.id,
    summary: `ایجاد پرسش متداول جدید «${created.question.slice(0, 40)}...» با شناسه ${created.anchorId}`,
  });

  return created;
}

export async function updateFaqItem(id: string, input: Partial<CreateFaqInput>, adminUserId: string) {
  const current = await db.faqItem.findUnique({ where: { id } });
  if (!current) {
    throw new Error('پرسش متداول مورد نظر یافت نشد.');
  }

  if (input.anchorId && input.anchorId !== current.anchorId) {
    const existing = await db.faqItem.findUnique({
      where: { anchorId: input.anchorId },
    });
    if (existing && existing.id !== id) {
      throw new Error(`شناسه لنگر «${input.anchorId}» توسط سوال دیگری استفاده شده است.`);
    }
  }

  const categoryLabel = input.category
    ? getCategoryLabel(input.category, input.categoryLabel ?? current.categoryLabel)
    : input.categoryLabel ?? current.categoryLabel;

  const updated = await db.faqItem.update({
    where: { id },
    data: {
      ...(input.anchorId ? { anchorId: input.anchorId } : {}),
      ...(input.question ? { question: input.question } : {}),
      ...(input.answer ? { answer: input.answer } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(categoryLabel !== undefined ? { categoryLabel } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
      ...(input.featuredInNav !== undefined ? { featuredInNav: input.featuredInNav } : {}),
      ...(input.featuredOnHome !== undefined ? { featuredOnHome: input.featuredOnHome } : {}),
      ...(input.relatedArticleSlug !== undefined ? { relatedArticleSlug: input.relatedArticleSlug } : {}),
      ...(input.relatedArticleLabel !== undefined ? { relatedArticleLabel: input.relatedArticleLabel } : {}),
      ...(input.blocks !== undefined ? { extraData: { blocks: input.blocks } } : {}),
    },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: 'UPDATE',
    entityType: 'FaqItem',
    entityId: updated.id,
    summary: `ویرایش پرسش متداول «${updated.question.slice(0, 40)}...»`,
  });

  return updated;
}

export async function deleteFaqItem(id: string, adminUserId: string) {
  const current = await db.faqItem.findUnique({ where: { id } });
  if (!current) {
    throw new Error('پرسش متداول مورد نظر یافت نشد.');
  }

  const deleted = await db.faqItem.delete({
    where: { id },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: 'DELETE',
    entityType: 'FaqItem',
    entityId: deleted.id,
    summary: `حذف پرسش متداول «${deleted.question.slice(0, 40)}...» با شناسه ${deleted.anchorId}`,
  });

  return deleted;
}

export async function reorderFaqItems(items: Array<{ id: string; sortOrder: number }>, adminUserId: string) {
  for (const item of items) {
    await db.faqItem.update({
      where: { id: item.id },
      data: { sortOrder: item.sortOrder },
    });
  }

  await recordAuditLog({
    userId: adminUserId,
    action: 'REORDER',
    entityType: 'FaqItem',
    summary: `تغییر ترتیب ${items.length} پرسش متداول`,
  });

  return true;
}

export async function toggleFaqPublishStatus(id: string, isPublished: boolean, adminUserId: string) {
  const updated = await db.faqItem.update({
    where: { id },
    data: { isPublished },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: 'UPDATE',
    entityType: 'FaqItem',
    entityId: id,
    summary: `تغییر وضعیت انتشار پرسش متداول به ${isPublished ? 'فعال' : 'غیرفعال'}`,
  });

  return updated;
}
