'use server';

/**
 * Media Server Actions (Phase 3, Task 2)
 * Admin-protected, rate-limited server actions for uploading and managing media assets.
 */

import { requireAdmin } from '@/server/auth/require-admin';
import { uploadAndProcessMedia, deleteMediaAsset } from '@/server/services/media-service';
import { recordAuditLog } from '@/server/services/audit-log-service';
import { checkRateLimit } from '@/lib/rate-limit';
import { db, MediaAssetRecord } from '@/server/db/client';
import { uiStringsFa } from '@/content/ui-strings.fa';
import { isMediaAssetReferenced } from '@/server/services/media-reference-tracker';

export interface MediaActionResult {
  success: boolean;
  data?: MediaAssetRecord;
  error?: string;
  status?: number;
}

/**
 * Uploads, validates, and processes an image into responsive WebP variants.
 * Strictly admin-only and rate-limited.
 */
export async function uploadMediaAction(formData: FormData): Promise<MediaActionResult> {
  try {
    // 1. Authorization check
    const { user } = await requireAdmin({ allowRedirect: false });

    // 2. Rate limit check (max 30 uploads per 5 minutes per user)
    const rateLimit = checkRateLimit(`media-upload:${user.id}`, {
      windowMs: 5 * 60 * 1000,
      maxAttempts: 30,
    });

    if (!rateLimit.success) {
      return {
        success: false,
        error: 'تعداد درخواست‌های بارگذاری بیش از حد مجاز است. لطفاً کمی بعد دوباره امتحان کنید.',
        status: 429,
      };
    }

    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
      return {
        success: false,
        error: uiStringsFa.adminMedia.noFileSelected,
        status: 400,
      };
    }

    const alt = (formData.get('alt') as string) || '';

    // Convert file to Node buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Process and persist
    const asset = await uploadAndProcessMedia({
      buffer,
      filename: file.name,
      alt,
      createdById: user.id,
    });

    // 4. Audit log hook
    await recordAuditLog({
      userId: user.id,
      action: 'MEDIA_UPLOAD',
      entityType: 'MediaAsset',
      entityId: asset.id,
      summary: `Image uploaded: ${asset.storageKey} (${asset.width}x${asset.height}, ${Math.round(asset.bytes / 1024)} KB)`,
    });

    return {
      success: true,
      data: asset,
    };
  } catch (err: any) {
    const errorMsg =
      err?.message || uiStringsFa.adminMedia.processingError;

    return {
      success: false,
      error: errorMsg,
      status: 400,
    };
  }
}

/**
 * Updates alt text for a MediaAsset.
 */
export async function updateMediaAltAction(params: {
  assetId: string;
  alt: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });
    const { assetId, alt } = params;

    const asset = await db.mediaAsset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return { success: false, error: 'تصویر مورد نظر یافت نشد.' };
    }

    await db.mediaAsset.update({
      where: { id: assetId },
      data: { alt: alt.trim() },
    });

    await recordAuditLog({
      userId: user.id,
      action: 'MEDIA_UPDATE_ALT',
      entityType: 'MediaAsset',
      entityId: assetId,
      summary: `Updated alt text for asset ${asset.storageKey}`,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Safely deletes a media asset ONLY if it is not referenced anywhere.
 */
export async function deleteMediaAssetAction(assetId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireAdmin({ allowRedirect: false });

    const isReferenced = await isMediaAssetReferenced(assetId);
    if (isReferenced) {
      return {
        success: false,
        error: 'این تصویر در بخش دیگری از سایت (محصول، دستور یا بخش‌های صفحه اصلی) استفاده شده است و امکان حذف آن وجود ندارد.',
      };
    }

    const asset = await db.mediaAsset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return { success: false, error: 'تصویر یافت نشد.' };
    }

    // Delete variant files and database record via domain service
    await deleteMediaAsset(assetId);

    await recordAuditLog({
      userId: user.id,
      action: 'MEDIA_DELETE',
      entityType: 'MediaAsset',
      entityId: assetId,
      summary: `Deleted media asset ${asset.storageKey}`,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
