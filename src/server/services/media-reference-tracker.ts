/**
 * Media Reference Tracking Service (Phase 3, Task 6)
 * Scans all database entities, relations, and arbitrary homepage section JSON
 * to ensure no image that is currently referenced anywhere on the site can ever be deleted.
 */

import { db } from '@/server/db/client';

export interface ReferenceLocation {
  entityType: 'Product' | 'Recipe' | 'SiteSettings' | 'HomepageSection';
  entityId: string;
  field: string;
}

/**
 * Recursively scans any JSON object or array for an asset ID or storage key.
 */
function scanJsonForAsset(json: any, targetId: string, storageKey?: string): boolean {
  if (!json) return false;

  if (typeof json === 'string') {
    if (json === targetId) return true;
    if (storageKey && json.includes(storageKey)) return true;
    return false;
  }

  if (Array.isArray(json)) {
    return json.some((item) => scanJsonForAsset(item, targetId, storageKey));
  }

  if (typeof json === 'object') {
    for (const [key, value] of Object.entries(json)) {
      if (
        (key === 'id' || key === 'assetId' || key === 'mediaId' || key === 'imageId') &&
        value === targetId
      ) {
        return true;
      }
      if (scanJsonForAsset(value, targetId, storageKey)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Finds all locations where a given MediaAsset is currently referenced.
 */
export async function findMediaAssetReferences(assetId: string): Promise<ReferenceLocation[]> {
  const references: ReferenceLocation[] = [];

  const asset = await db.mediaAsset.findUnique({ where: { id: assetId } });
  const storageKey = asset?.storageKey;

  // 1. Check Products (main image and gallery)
  const products = await db.product.findMany();
  for (const p of products) {
    if (p.mainImageId === assetId) {
      references.push({ entityType: 'Product', entityId: p.id, field: 'mainImageId' });
    }
    if (Array.isArray(p.gallery)) {
      const inGallery = p.gallery.some((g: any) => g.assetId === assetId || g.id === assetId);
      if (inGallery) {
        references.push({ entityType: 'Product', entityId: p.id, field: 'gallery' });
      }
    }
  }

  // 2. Check Recipes (main image and gallery)
  const recipes = await db.recipe.findMany();
  for (const r of recipes) {
    if (r.mainImageId === assetId) {
      references.push({ entityType: 'Recipe', entityId: r.id, field: 'mainImageId' });
    }
    if (Array.isArray(r.gallery)) {
      const inGallery = r.gallery.some((g: any) => g.assetId === assetId || g.id === assetId);
      if (inGallery) {
        references.push({ entityType: 'Recipe', entityId: r.id, field: 'gallery' });
      }
    }
  }

  // 3. Check SiteSettings (logoId, footerLogoId, ogImageId)
  const settings = await db.siteSettings.findFirst();
  if (settings) {
    if (settings.logoId === assetId) {
      references.push({ entityType: 'SiteSettings', entityId: String(settings.id), field: 'logoId' });
    }
    if (settings.footerLogoId === assetId) {
      references.push({ entityType: 'SiteSettings', entityId: String(settings.id), field: 'footerLogoId' });
    }
    if (settings.ogImageId === assetId) {
      references.push({ entityType: 'SiteSettings', entityId: String(settings.id), field: 'ogImageId' });
    }
  }

  // 4. Check Homepage Sections (deep scan through dynamic JSON content)
  const sections = await db.homepageSection.findMany();
  for (const s of sections) {
    if (scanJsonForAsset(s.content, assetId, storageKey)) {
      references.push({ entityType: 'HomepageSection', entityId: s.id, field: 'content' });
    }
  }

  return references;
}

/**
 * Returns true if the MediaAsset is actively in use anywhere on the website.
 */
export async function isMediaAssetReferenced(assetId: string): Promise<boolean> {
  const refs = await findMediaAssetReferences(assetId);
  return refs.length > 0;
}
