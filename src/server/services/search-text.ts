/**
 * Search Text Maintenance Service (Phase 1)
 * Builds and normalizes unified search text for Products and Recipes.
 * Called by the service layer on every insert and update.
 */

import { normalizeSearchText } from '@/lib/domain-utils';

export interface ProductSearchData {
  nameFa: string;
  nameOriginal?: string | null;
  foodNature?: string | null;
  vitamins?: string | null;
  harvestSeason?: string | null;
  harvestPlace?: string | null;
  color?: string | null;
  usageWarning?: string | null;
  benefits?: string[];
  categoryNames?: string[];
}

export function buildProductSearchText(data: ProductSearchData): string {
  const parts: string[] = [
    data.nameFa,
    data.nameOriginal || '',
    data.foodNature || '',
    data.vitamins || '',
    data.harvestSeason || '',
    data.harvestPlace || '',
    data.color || '',
    data.usageWarning || '',
    ...(data.benefits || []),
    ...(data.categoryNames || []),
  ];

  const rawText = parts.filter(Boolean).join(' ');
  return normalizeSearchText(rawText);
}

export interface RecipeSearchData {
  nameFa: string;
  nameOriginal?: string | null;
  country?: string | null;
  yieldText?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
  ingredientNames?: string[];
  ingredientNotes?: string[];
  categoryNames?: string[];
}

export function buildRecipeSearchText(data: RecipeSearchData): string {
  const parts: string[] = [
    data.nameFa,
    data.nameOriginal || '',
    data.country || '',
    data.yieldText || '',
    data.shortDescription || '',
    data.longDescription || '',
    ...(data.ingredientNames || []),
    ...(data.ingredientNotes || []),
    ...(data.categoryNames || []),
  ];

  const rawText = parts.filter(Boolean).join(' ');
  return normalizeSearchText(rawText);
}
