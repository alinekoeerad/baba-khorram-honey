import { db } from '@/server/db/client';
import {
  MAGAZINE_ARTICLES,
  getMagazineArticleBySlug as getStaticMagazineArticleBySlug,
  type MagazineArticle,
  type MagazineCardTheme,
  type MagazineCategoryId,
} from '@/content/magazine-articles';
import { recordAuditLog } from '@/server/services/audit-log-service';
import type {
  CreateMagazineArticleInput,
  UpdateMagazineArticleInput,
} from '@/server/validation/magazine-schemas';

function normalizeTheme(theme?: string | null): MagazineCardTheme {
  switch (theme) {
    case 'GREEN':
      return 'GREEN';
    case 'ORANGE':
    case 'POLLEN':
      return 'ORANGE';
    case 'BURGUNDY':
    case 'PROPOLIS':
      return 'BURGUNDY';
    case 'YELLOW':
    case 'HONEY':
    case 'ROYAL_JELLY':
    default:
      return 'YELLOW';
  }
}

export function formatDbArticleToPublic(r: any): MagazineArticle {
  const sections = Array.isArray(r.sections) ? r.sections : [];
  const theme = normalizeTheme(r.theme);

  return {
    slug: r.slug,
    title: r.title,
    shortTitle: r.shortTitle || r.title,
    subtitle: r.subtitle || '',
    excerpt: r.excerpt,
    category: (r.category || 'honey-science') as MagazineCategoryId,
    categoryLabel:
      r.categoryLabel ||
      (r.category === 'bee-products'
        ? 'فرآورده‌های ارزشمند کندو'
        : 'دانش و پژوهش عسل'),
    badge: r.badge || 'مقاله علمی',
    theme,
    imageUrl: r.coverImage || '/images/products/royal-jelly.webp',
    readTimeMinutes: r.readTimeMinutes || 5,
    featuredInNav: Boolean(r.featuredInNav),
    navOrder: r.navOrder || 0,
    sections,
  };
}

export async function getPublicMagazineArticles(): Promise<MagazineArticle[]> {
  try {
    const rows = await db.magazineArticle.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { sortOrder: 'asc' },
    });

    if (rows && rows.length > 0) {
      return rows.map(formatDbArticleToPublic);
    }
  } catch (err) {
    console.warn('Failed to query magazine articles from db, falling back to static articles:', err);
  }

  return MAGAZINE_ARTICLES;
}

export async function getPublicMagazineArticleBySlug(
  slug: string
): Promise<MagazineArticle | undefined> {
  try {
    const row = await db.magazineArticle.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
    });

    if (row) {
      return formatDbArticleToPublic(row);
    }
  } catch (err) {
    console.warn(`Failed to query magazine article by slug (${slug}) from db, falling back:`, err);
  }

  return getStaticMagazineArticleBySlug(slug);
}

export async function getAdminMagazineArticles(): Promise<any[]> {
  try {
    const rows = await db.magazineArticle.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    if (rows && rows.length > 0) {
      return rows;
    }
  } catch (err) {
    console.warn('Admin magazine articles query error, falling back:', err);
  }

  // Fallback if empty in fresh environment
  return MAGAZINE_ARTICLES.map((art, idx) => ({
    id: `art_${art.slug}`,
    slug: art.slug,
    title: art.title,
    shortTitle: art.shortTitle,
    subtitle: art.subtitle,
    excerpt: art.excerpt,
    coverImage: art.imageUrl,
    category: art.category,
    categoryLabel: art.categoryLabel,
    badge: art.badge,
    theme: art.theme,
    readTime: `${art.readTimeMinutes} دقیقه مطالعه`,
    readTimeMinutes: art.readTimeMinutes,
    status: 'PUBLISHED',
    sortOrder: idx,
    featuredInNav: art.featuredInNav,
    navOrder: art.navOrder,
    sections: art.sections,
    seoTitle: art.title,
    seoDescription: art.excerpt,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

export async function getMagazineArticleById(id: string): Promise<any | null> {
  try {
    const item = await db.magazineArticle.findUnique({
      where: { id },
    });
    if (item) return item;
  } catch (err) {
    console.warn(`Failed to find magazine article by id ${id}:`, err);
  }

  // Check fallback by slug
  const fallback = MAGAZINE_ARTICLES.find(
    (a) => a.slug === id || `art_${a.slug}` === id
  );
  if (fallback) {
    return {
      id: `art_${fallback.slug}`,
      slug: fallback.slug,
      title: fallback.title,
      shortTitle: fallback.shortTitle,
      subtitle: fallback.subtitle,
      excerpt: fallback.excerpt,
      coverImage: fallback.imageUrl,
      category: fallback.category,
      categoryLabel: fallback.categoryLabel,
      badge: fallback.badge,
      theme: fallback.theme,
      readTime: `${fallback.readTimeMinutes} دقیقه مطالعه`,
      readTimeMinutes: fallback.readTimeMinutes,
      status: 'PUBLISHED',
      sortOrder: 0,
      featuredInNav: fallback.featuredInNav,
      navOrder: fallback.navOrder,
      sections: fallback.sections,
      seoTitle: fallback.title,
      seoDescription: fallback.excerpt,
    };
  }

  return null;
}

export async function createMagazineArticle(
  data: CreateMagazineArticleInput,
  adminUserId?: string
) {
  const existing = await db.magazineArticle.findUnique({
    where: { slug: data.slug },
  });
  if (existing) {
    throw new Error(`مقاله‌ای با شناسه آدرس (slug) "${data.slug}" از قبل وجود دارد.`);
  }

  const created = await db.magazineArticle.create({
    data: {
      slug: data.slug,
      title: data.title,
      shortTitle: data.shortTitle || null,
      subtitle: data.subtitle || null,
      excerpt: data.excerpt,
      coverImage: data.coverImage || null,
      category: data.category,
      categoryLabel: data.categoryLabel || null,
      badge: data.badge || null,
      theme: data.theme as any,
      readTime: data.readTime || `${data.readTimeMinutes} دقیقه مطالعه`,
      readTimeMinutes: data.readTimeMinutes,
      status: data.status,
      sortOrder: data.sortOrder,
      featuredInNav: data.featuredInNav,
      navOrder: data.navOrder,
      sections: data.sections as any,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
    },
  });

  if (adminUserId) {
    await recordAuditLog({
      userId: adminUserId,
      action: 'CREATE',
      entityType: 'MagazineArticle',
      entityId: created.id,
      summary: `ایجاد مقاله علمی: ${created.title} (${created.slug})`,
    });
  }

  return created;
}

export async function updateMagazineArticle(
  id: string,
  data: UpdateMagazineArticleInput,
  adminUserId?: string
) {
  if (data.slug) {
    const existing = await db.magazineArticle.findUnique({
      where: { slug: data.slug },
    });
    if (existing && existing.id !== id) {
      throw new Error(`مقاله‌ای با شناسه آدرس "${data.slug}" قبلاً ثبت شده است.`);
    }
  }

  const updateData: any = {};
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.shortTitle !== undefined) updateData.shortTitle = data.shortTitle;
  if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.categoryLabel !== undefined) updateData.categoryLabel = data.categoryLabel;
  if (data.badge !== undefined) updateData.badge = data.badge;
  if (data.theme !== undefined) updateData.theme = data.theme;
  if (data.readTime !== undefined) updateData.readTime = data.readTime;
  if (data.readTimeMinutes !== undefined) updateData.readTimeMinutes = data.readTimeMinutes;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
  if (data.featuredInNav !== undefined) updateData.featuredInNav = data.featuredInNav;
  if (data.navOrder !== undefined) updateData.navOrder = data.navOrder;
  if (data.sections !== undefined) updateData.sections = data.sections;
  if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle;
  if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription;

  const updated = await db.magazineArticle.update({
    where: { id },
    data: updateData,
  });

  if (adminUserId) {
    await recordAuditLog({
      userId: adminUserId,
      action: 'UPDATE',
      entityType: 'MagazineArticle',
      entityId: updated.id,
      summary: `ویرایش مقاله علمی: ${updated.title} (${updated.slug})`,
    });
  }

  return updated;
}

export async function deleteMagazineArticle(id: string, adminUserId?: string) {
  const existing = await db.magazineArticle.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('مقاله مورد نظر یافت نشد.');
  }

  const deleted = await db.magazineArticle.delete({
    where: { id },
  });

  if (adminUserId) {
    await recordAuditLog({
      userId: adminUserId,
      action: 'DELETE',
      entityType: 'MagazineArticle',
      entityId: id,
      summary: `حذف مقاله علمی: ${existing.title} (${existing.slug})`,
    });
  }

  return deleted;
}

export async function toggleMagazineArticleStatus(
  id: string,
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
  adminUserId?: string
) {
  const updated = await db.magazineArticle.update({
    where: { id },
    data: { status },
  });

  if (adminUserId) {
    await recordAuditLog({
      userId: adminUserId,
      action: 'UPDATE',
      entityType: 'MagazineArticle',
      entityId: id,
      summary: `تغییر وضعیت مقاله به ${status}`,
    });
  }

  return updated;
}

export async function reorderMagazineArticles(
  items: Array<{ id: string; sortOrder: number }>,
  adminUserId?: string
) {
  for (const item of items) {
    await db.magazineArticle.update({
      where: { id: item.id },
      data: { sortOrder: item.sortOrder },
    });
  }

  if (adminUserId) {
    await recordAuditLog({
      userId: adminUserId,
      action: 'REORDER',
      entityType: 'MagazineArticle',
      summary: `مرتب‌سازی ${items.length} مقاله مجله علمی`,
    });
  }
}
