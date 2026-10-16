/**
 * Zod Validation Schemas (Phase 1)
 * Inputs for Category, Product (including options), and Recipe.
 * All Persian error messages are sourced from uiStringsFa.
 */

import { z } from 'zod';
import { uiStringsFa } from '@/content/ui-strings.fa';

const latinSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ---------------------------------------------------------------
// Category Schemas
// ---------------------------------------------------------------

export const categoryInputSchema = z.object({
  name: z
    .string()
    .min(1, uiStringsFa.validation.categoryNameRequired)
    .trim(),
  slug: z
    .string()
    .min(1, uiStringsFa.validation.slugRequired)
    .regex(latinSlugRegex, uiStringsFa.validation.slugInvalid)
    .trim(),
  type: z.enum(['PRODUCT', 'RECIPE'] as const),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  sortOrder: z.coerce.number().int().default(0),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

// ---------------------------------------------------------------
// Product & ProductOption Schemas
// ---------------------------------------------------------------

export const productOptionInputSchema = z.object({
  id: z.string().optional(),
  label: z
    .string()
    .min(1, uiStringsFa.validation.optionLabelRequired)
    .trim(),
  isAvailable: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export type ProductOptionInput = z.infer<typeof productOptionInputSchema>;

export const productInputSchema = z.object({
  nameFa: z
    .string()
    .min(1, uiStringsFa.validation.nameFaRequired)
    .trim(),
  nameOriginal: z.string().trim().optional().nullable(),
  slug: z
    .string()
    .min(1, uiStringsFa.validation.slugRequired)
    .regex(latinSlugRegex, uiStringsFa.validation.slugInvalid)
    .trim(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  cardTheme: z.enum(['AUTO', 'GREEN', 'ORANGE', 'YELLOW', 'BURGUNDY']).default('AUTO'),
  sortOrder: z.coerce.number().int().default(0),
  shortDescription: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  foodNature: z.string().trim().optional().nullable(),
  vitamins: z.string().trim().optional().nullable(),
  harvestSeason: z.string().trim().optional().nullable(),
  harvestPlace: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
  usageWarning: z.string().trim().optional().nullable(),
  benefits: z.array(z.string().trim()).default([]),
  options: z.array(productOptionInputSchema).default([]),
  categoryIds: z.array(z.string()).default([]),
});

export type ProductInput = z.infer<typeof productInputSchema>;

// ---------------------------------------------------------------
// Recipe Schemas
// ---------------------------------------------------------------

export const recipeIngredientInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, uiStringsFa.validation.required).trim(),
  quantityText: z.string().trim().optional().nullable(),
  unit: z.string().trim().optional().nullable(),
  equivalentText: z.string().trim().optional().nullable(),
  isOptional: z.boolean().default(false),
  note: z.string().trim().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
});

export type RecipeIngredientInput = z.infer<typeof recipeIngredientInputSchema>;

export const recipeStepInputSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, uiStringsFa.validation.required).trim(),
  sortOrder: z.coerce.number().int().default(0),
});

export type RecipeStepInput = z.infer<typeof recipeStepInputSchema>;

export const recipeInputSchema = z.object({
  nameFa: z
    .string()
    .min(1, uiStringsFa.validation.nameFaRequired)
    .trim(),
  nameOriginal: z.string().trim().optional().nullable(),
  slug: z
    .string()
    .min(1, uiStringsFa.validation.slugRequired)
    .regex(latinSlugRegex, uiStringsFa.validation.slugInvalid)
    .trim(),
  country: z.string().trim().optional().nullable(),
  servingTypes: z
    .array(z.enum(['HOT', 'WARM', 'COLD'] as const))
    .min(1, uiStringsFa.validation.servingTypeRequired),
  yieldText: z.string().trim().optional().nullable(),
  shortDescription: z.string().trim().optional().nullable(),
  longDescription: z.string().trim().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  isFeatured: z.boolean().default(false),
  cardTheme: z.enum(['AUTO', 'GREEN', 'ORANGE', 'YELLOW', 'BURGUNDY']).default('AUTO'),
  sortOrder: z.coerce.number().int().default(0),
  ingredients: z.array(recipeIngredientInputSchema).default([]),
  steps: z.array(recipeStepInputSchema).default([]),
  categoryIds: z.array(z.string()).default([]),
  recommendedProductIds: z.array(z.string()).optional().default([]),
});

export type RecipeInput = z.infer<typeof recipeInputSchema>;
