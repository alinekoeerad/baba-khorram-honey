import { describe, it, expect } from 'vitest';
import { productInputSchema, recipeInputSchema } from '@/server/validation';
import { ProductService } from '@/server/services/product-service';
import { RecipeService } from '@/server/services/recipe-service';
import { db } from '@/server/db/client';

describe('Multi-Image Gallery Pipeline', () => {
  describe('Zod Validation Schemas', () => {
    it('validates productInputSchema with mainImageId and galleryAssetIds', () => {
      const parsed = productInputSchema.parse({
        nameFa: 'عسل گون کوهی',
        slug: 'astragalus-test',
        status: 'PUBLISHED',
        categoryIds: ['cat_honey-types'],
        mainImageId: 'ast_main_1',
        galleryAssetIds: ['ast_gal_1', 'ast_gal_2', 'ast_gal_3'],
      });

      expect(parsed.mainImageId).toBe('ast_main_1');
      expect(parsed.galleryAssetIds).toEqual(['ast_gal_1', 'ast_gal_2', 'ast_gal_3']);
    });

    it('validates recipeInputSchema with mainImageId and galleryAssetIds', () => {
      const parsed = recipeInputSchema.parse({
        nameFa: 'دسر عسل و گردو',
        slug: 'honey-walnut-test',
        servingTypes: ['COLD'],
        categoryIds: ['cat_desserts'],
        mainImageId: 'ast_recipe_main',
        galleryAssetIds: ['ast_step_1', 'ast_step_2'],
      });

      expect(parsed.mainImageId).toBe('ast_recipe_main');
      expect(parsed.galleryAssetIds).toEqual(['ast_step_1', 'ast_step_2']);
    });
  });

  describe('Product Gallery Persistence & Retrieval', () => {
    it('persists and updates product gallery items with proper sortOrder', async () => {
      const testSlug = `product-gallery-test-${Date.now()}`;
      const productInput = productInputSchema.parse({
        nameFa: 'عسل کوهستان تست گالری',
        slug: testSlug,
        status: 'PUBLISHED',
        categoryIds: ['cat_honey-types'],
        mainImageId: 'ast_seed_jar1',
        galleryAssetIds: ['ast_seed_gal1', 'ast_seed_gal2'],
      });
      const product = await ProductService.createProduct(productInput);

      expect(product.id).toBeDefined();

      // Retrieve via db.product.findUnique with gallery included
      const fetched = await db.product.findUnique({
        where: { id: product.id },
        include: { gallery: { include: { asset: true }, orderBy: { sortOrder: 'asc' } } },
      });

      expect(fetched).toBeDefined();
      expect(fetched?.gallery).toBeDefined();
      expect(fetched?.gallery?.length).toBe(2);
      expect(fetched?.gallery?.[0].assetId).toBe('ast_seed_gal1');
      expect(fetched?.gallery?.[0].sortOrder).toBe(0);
      expect(fetched?.gallery?.[1].assetId).toBe('ast_seed_gal2');
      expect(fetched?.gallery?.[1].sortOrder).toBe(1);

      // Now update the product with reordered and new gallery items
      await ProductService.updateProduct(product.id, {
        galleryAssetIds: ['ast_seed_gal2', 'ast_seed_gal3'],
      });

      const updated = await db.product.findUnique({
        where: { id: product.id },
        include: { gallery: { include: { asset: true }, orderBy: { sortOrder: 'asc' } } },
      });

      expect(updated?.gallery?.length).toBe(2);
      expect(updated?.gallery?.[0].assetId).toBe('ast_seed_gal2');
      expect(updated?.gallery?.[0].sortOrder).toBe(0);
      expect(updated?.gallery?.[1].assetId).toBe('ast_seed_gal3');
      expect(updated?.gallery?.[1].sortOrder).toBe(1);

      // Cleanup to preserve seed file product counts
      await db.productGalleryItem.deleteMany({ where: { productId: product.id } });
      await db.product.delete({ where: { id: product.id } });
    });
  });

  describe('Recipe Gallery Persistence & Retrieval', () => {
    it('persists and updates recipe gallery items with proper sortOrder', async () => {
      const testSlug = `recipe-gallery-test-${Date.now()}`;
      const recipeInput = recipeInputSchema.parse({
        nameFa: 'معجون عسل تست گالری',
        slug: testSlug,
        status: 'PUBLISHED',
        servingTypes: ['WARM'],
        categoryIds: ['cat_drinks'],
        mainImageId: 'ast_recipe_main',
        galleryAssetIds: ['ast_step_1', 'ast_step_2'],
      });
      const recipe = await RecipeService.createRecipe(recipeInput);

      expect(recipe.id).toBeDefined();

      const fetched = await db.recipe.findUnique({
        where: { id: recipe.id },
        include: { gallery: { include: { asset: true }, orderBy: { sortOrder: 'asc' } } },
      });

      expect(fetched).toBeDefined();
      expect(fetched?.gallery).toBeDefined();
      expect(fetched?.gallery?.length).toBe(2);
      expect(fetched?.gallery?.[0].assetId).toBe('ast_step_1');
      expect(fetched?.gallery?.[0].sortOrder).toBe(0);
      expect(fetched?.gallery?.[1].assetId).toBe('ast_step_2');
      expect(fetched?.gallery?.[1].sortOrder).toBe(1);

      // Cleanup to preserve seed file recipe counts
      await db.recipeGalleryItem.deleteMany({ where: { recipeId: recipe.id } });
      await db.recipe.delete({ where: { id: recipe.id } });
    });
  });
});
