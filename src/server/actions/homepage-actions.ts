/**
 * Homepage CMS Server Actions (Brief Section 7)
 *
 * Implements:
 * - createHomepageSectionAction
 * - updateHomepageSectionAction
 * - deleteHomepageSectionAction
 * - toggleHomepageSectionStatusAction
 * - reorderHomepageSectionAction
 * - switchHomepageSectionTemplateAction
 *
 * All operations enforce:
 * - Server-side admin authentication via requireAdmin
 * - Zod schema validation
 * - Audit logging (recordAuditLog)
 * - Cache revalidation
 */

'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/require-admin';
import { recordAuditLog } from '@/server/services/audit-log-service';
import {
  homepageSectionInputSchema,
  heroContentSchema,
  imageTextContentSchema,
  fullImageOverlayContentSchema,
  textGalleryContentSchema,
  cardCarouselContentSchema,
  contentGridContentSchema,
  HomepageSectionInput,
} from '@/server/validation/homepage-schemas';
import { switchSectionTemplate, TEMPLATE_REGISTRY } from '@/server/services/homepage-template-service';
import { DEFAULT_SECTIONS_INIT } from '@/server/queries/homepage-sections';
import { SectionStatus, SectionBackground, SectionType } from '@prisma/client';

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

function validateSectionContent(type: string, content: any): Record<string, any> {
  switch (type) {
    case 'HERO':
      return heroContentSchema.parse(content);
    case 'IMAGE_TEXT':
      return imageTextContentSchema.parse(content);
    case 'FULL_IMAGE_OVERLAY':
      return fullImageOverlayContentSchema.parse(content);
    case 'TEXT_GALLERY':
      return textGalleryContentSchema.parse(content);
    case 'CARD_CAROUSEL':
      return cardCarouselContentSchema.parse(content);
    case 'CONTENT_GRID':
      return contentGridContentSchema.parse(content);
    case 'ARTISAN_HERITAGE':
    case 'HONEY_FINDER':
    case 'TESTIMONIALS':
    case 'FAQ_SECTION':
      return content || {};
    default:
      throw new Error(`نوع سکشن نامعتبر است: ${type}`);
  }
}

/**
 * Create a new homepage section (defaults to DRAFT).
 */
export async function createHomepageSectionAction(
  rawInput: HomepageSectionInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const admin = await requireAdmin({ allowRedirect: false });
    const validatedInput = homepageSectionInputSchema.parse(rawInput);
    const validatedContent = validateSectionContent(validatedInput.type, validatedInput.content);

    // Calculate next sortOrder
    const maxOrderSection = await db.homepageSection.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const nextOrder = (maxOrderSection?.sortOrder ?? -1) + 1;

    const newSection = await db.homepageSection.create({
      data: {
        internalName: validatedInput.internalName,
        type: validatedInput.type as SectionType,
        template: validatedInput.template,
        status: (validatedInput.status as SectionStatus) || 'DRAFT',
        background: (validatedInput.background as SectionBackground) || 'NONE',
        sortOrder: nextOrder,
        content: validatedContent,
      },
    });

    await recordAuditLog({
      userId: admin.user.id,
      action: 'CREATE',
      entityType: 'HOMEPAGE_SECTION',
      entityId: newSection.id,
      summary: `سکشن جدید «${newSection.internalName}» با قالب ${newSection.template} ایجاد شد.`,
    });

    revalidatePath('/');
    revalidatePath('/admin/homepage');
    revalidatePath('/admin/preview/homepage');

    return { success: true, data: { id: newSection.id } };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در ایجاد سکشن صفحه اصلی' };
  }
}

/**
 * Update an existing homepage section.
 */
export async function updateHomepageSectionAction(
  id: string,
  rawInput: Partial<HomepageSectionInput>
): Promise<ActionResponse> {
  try {
    const admin = await requireAdmin({ allowRedirect: false });

    const existing = await db.homepageSection.findUnique({
      where: { id },
    });
    if (!existing) {
      return { success: false, error: 'سکشن مورد نظر یافت نشد.' };
    }

    const type = rawInput.type || existing.type;
    const content = rawInput.content !== undefined ? rawInput.content : (existing.content as Record<string, any>);
    const validatedContent = validateSectionContent(type, content);

    const updated = await db.homepageSection.update({
      where: { id },
      data: {
        internalName: rawInput.internalName !== undefined ? rawInput.internalName.trim() : existing.internalName,
        status: (rawInput.status as SectionStatus) || existing.status,
        background: (rawInput.background as SectionBackground) || existing.background,
        content: validatedContent,
      },
    });

    await recordAuditLog({
      userId: admin.user.id,
      action: 'UPDATE',
      entityType: 'HOMEPAGE_SECTION',
      entityId: updated.id,
      summary: `سکشن «${updated.internalName}» به‌روزرسانی شد.`,
    });

    revalidatePath('/');
    revalidatePath('/admin/homepage');
    revalidatePath('/admin/preview/homepage');

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در ویرایش سکشن' };
  }
}

/**
 * Delete a homepage section.
 */
export async function deleteHomepageSectionAction(id: string): Promise<ActionResponse> {
  try {
    const admin = await requireAdmin({ allowRedirect: false });

    const existing = await db.homepageSection.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'سکشن یافت نشد.' };
    }

    await db.homepageSection.delete({ where: { id } });

    await recordAuditLog({
      userId: admin.user.id,
      action: 'DELETE',
      entityType: 'HOMEPAGE_SECTION',
      entityId: id,
      summary: `سکشن «${existing.internalName}» حذف شد.`,
    });

    revalidatePath('/');
    revalidatePath('/admin/homepage');
    revalidatePath('/admin/preview/homepage');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در حذف سکشن' };
  }
}

/**
 * Toggle section status (DRAFT | ACTIVE | DISABLED).
 */
export async function toggleHomepageSectionStatusAction(
  id: string,
  newStatus: SectionStatus
): Promise<ActionResponse> {
  try {
    const admin = await requireAdmin({ allowRedirect: false });

    const updated = await db.homepageSection.update({
      where: { id },
      data: { status: newStatus },
    });

    await recordAuditLog({
      userId: admin.user.id,
      action: 'UPDATE',
      entityType: 'HOMEPAGE_SECTION',
      entityId: id,
      summary: `وضعیت سکشن «${updated.internalName}» به ${newStatus} تغییر یافت.`,
    });

    revalidatePath('/');
    revalidatePath('/admin/homepage');
    revalidatePath('/admin/preview/homepage');

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در تغییر وضعیت' };
  }
}

/**
 * Reorder section (UP | DOWN) by swapping sortOrder with adjacent section.
 */
export async function reorderHomepageSectionAction(
  id: string,
  direction: 'UP' | 'DOWN'
): Promise<ActionResponse> {
  try {
    const admin = await requireAdmin({ allowRedirect: false });

    const allSections = await db.homepageSection.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const index = allSections.findIndex((s: any) => s.id === id);
    if (index === -1) {
      return { success: false, error: 'سکشن یافت نشد.' };
    }

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= allSections.length) {
      return { success: false, error: 'امکان جابه‌جایی بیشتر وجود ندارد.' };
    }

    const currentSection = allSections[index];
    const reordered = [...allSections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Update all sortOrders sequentially to guarantee clean ordering
    await db.$transaction(
      reordered.map((sec, i) =>
        db.homepageSection.update({
          where: { id: sec.id },
          data: { sortOrder: i + 1 },
        })
      )
    );

    await recordAuditLog({
      userId: admin.user.id,
      action: 'REORDER',
      entityType: 'HOMEPAGE_SECTION',
      entityId: id,
      summary: `ترتیب سکشن «${currentSection.internalName}» جابه‌جا شد (${direction}).`,
    });

    revalidatePath('/');
    revalidatePath('/admin/homepage');
    revalidatePath('/admin/preview/homepage');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در مرتب‌سازی سکشن‌ها' };
  }
}

/**
 * Switch template with preserved bucket field mapping.
 */
export async function switchHomepageSectionTemplateAction(
  id: string,
  newTemplateId: string
): Promise<ActionResponse> {
  try {
    const admin = await requireAdmin({ allowRedirect: false });

    const existing = await db.homepageSection.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'سکشن یافت نشد.' };
    }

    const newDef = TEMPLATE_REGISTRY[newTemplateId];
    if (!newDef) {
      return { success: false, error: `قالب مقصد نامعتبر است: ${newTemplateId}` };
    }

    const convertedContent = switchSectionTemplate(
      existing.template,
      newTemplateId,
      existing.content as Record<string, any>
    );

    const updated = await db.homepageSection.update({
      where: { id },
      data: {
        type: newDef.sectionType,
        template: newTemplateId,
        background: newDef.defaultBackground || existing.background,
        content: convertedContent,
      },
    });

    await recordAuditLog({
      userId: admin.user.id,
      action: 'UPDATE',
      entityType: 'HOMEPAGE_SECTION',
      entityId: id,
      summary: `قالب سکشن «${existing.internalName}» از ${existing.template} به ${newTemplateId} تغییر یافت.`,
    });

    revalidatePath('/');
    revalidatePath('/admin/homepage');
    revalidatePath('/admin/preview/homepage');

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در تغییر قالب' };
  }
}

/**
 * Seed canonical default homepage sections if none exist.
 */
export async function seedDefaultHomepageSectionsAction(): Promise<ActionResponse<{ count: number }>> {
  try {
    const admin = await requireAdmin({ allowRedirect: false });

    const existingCount = await db.homepageSection.count();
    if (existingCount > 0) {
      return { success: false, error: 'سکشن‌های صفحه اصلی در حال حاضر موجود هستند.' };
    }

    let created = 0;
    for (const section of DEFAULT_SECTIONS_INIT) {
      await db.homepageSection.create({
        data: {
          internalName: section.internalName,
          type: section.type,
          template: section.template,
          status: section.status,
          sortOrder: section.sortOrder,
          background: section.background,
          content: section.content,
        },
      });
      created++;
    }

    await recordAuditLog({
      userId: admin.user.id,
      action: 'CREATE',
      entityType: 'HOMEPAGE_SECTION',
      entityId: 'seed-defaults',
      summary: `${created} سکشن پیش‌فرض صفحه اصلی بارگذاری شد.`,
    });

    revalidatePath('/');
    revalidatePath('/admin/homepage');
    revalidatePath('/admin/preview/homepage');

    return { success: true, data: { count: created } };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در بارگذاری سکشن‌های پیش‌فرض' };
  }
}

