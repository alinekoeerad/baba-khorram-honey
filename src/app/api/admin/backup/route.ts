/**
 * Admin Database Backup & Export Endpoint
 * GET /api/admin/backup
 *
 * Securely extracts all system tables into a formatted JSON dump,
 * protected by requireAdmin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth/require-admin';
import { db } from '@/server/db/client';
import { recordAuditLog } from '@/server/services/audit-log-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin({ allowRedirect: false });

    // Fetch all domain tables in parallel
    const [
      users,
      accounts,
      categories,
      mediaAssets,
      products,
      productBenefits,
      productOptions,
      productCategories,
      productGalleryItems,
      recipes,
      recipeIngredients,
      recipeSteps,
      recipeCategories,
      recipeGalleryItems,
      homepageSections,
      sectionItems,
      siteSettings,
      contactChannels,
      orders,
      orderShareLinks,
      faqItems,
      magazineArticles,
      feedbacks,
      auditLogs,
    ] = await Promise.all([
      db.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      }),
      db.account.findMany(),
      db.category.findMany(),
      db.mediaAsset.findMany(),
      db.product.findMany(),
      db.productBenefit.findMany(),
      db.productOption.findMany(),
      db.productCategory.findMany(),
      db.productGalleryItem.findMany(),
      db.recipe.findMany(),
      db.recipeIngredient.findMany(),
      db.recipeStep.findMany(),
      db.recipeCategory.findMany(),
      db.recipeGalleryItem.findMany(),
      db.homepageSection.findMany(),
      db.sectionItem.findMany(),
      db.siteSettings.findMany(),
      db.contactChannel.findMany(),
      db.order.findMany(),
      db.orderShareLink.findMany(),
      db.faqItem.findMany(),
      db.magazineArticle.findMany(),
      db.feedback.findMany(),
      db.auditLog.findMany({ take: 1000, orderBy: { createdAt: 'desc' } }),
    ]);

    const backupData = {
      meta: {
        exportedAt: new Date().toISOString(),
        exportedBy: auth.user.email || auth.user.name || auth.user.id,
        appName: 'Persian Honey Platform (Baba Khorram)',
        schemaVersion: '7.0',
        tableCounts: {
          users: users.length,
          accounts: accounts.length,
          categories: categories.length,
          mediaAssets: mediaAssets.length,
          products: products.length,
          productBenefits: productBenefits.length,
          productOptions: productOptions.length,
          productCategories: productCategories.length,
          productGalleryItems: productGalleryItems.length,
          recipes: recipes.length,
          recipeIngredients: recipeIngredients.length,
          recipeSteps: recipeSteps.length,
          recipeCategories: recipeCategories.length,
          recipeGalleryItems: recipeGalleryItems.length,
          homepageSections: homepageSections.length,
          sectionItems: sectionItems.length,
          siteSettings: siteSettings.length,
          contactChannels: contactChannels.length,
          orders: orders.length,
          orderShareLinks: orderShareLinks.length,
          faqItems: faqItems.length,
          magazineArticles: magazineArticles.length,
          feedbacks: feedbacks.length,
          auditLogs: auditLogs.length,
        },
      },
      data: {
        users,
        accounts,
        categories,
        mediaAssets,
        products,
        productBenefits,
        productOptions,
        productCategories,
        productGalleryItems,
        recipes,
        recipeIngredients,
        recipeSteps,
        recipeCategories,
        recipeGalleryItems,
        homepageSections,
        sectionItems,
        siteSettings,
        contactChannels,
        orders,
        orderShareLinks,
        faqItems,
        magazineArticles,
        feedbacks,
        auditLogs,
      },
    };

    // Log the backup export for security compliance
    await recordAuditLog({
      action: 'EXPORT',
      entityType: 'DATABASE_BACKUP',
      entityId: `backup_${Date.now()}`,
      userId: auth.user.id,
      summary: `خروجی پشتیبان دیتابیس (JSON dump) با ${Object.keys(backupData.meta.tableCounts).length} جدول توسط ${auth.user.name || auth.user.email} دانلود شد.`,
    });

    const filename = `honey_backup_${new Date().toISOString().slice(0, 10)}_${Date.now()}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[Admin Backup API] Failed to export database:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Unauthorized or failed to create backup',
        message: error?.message || 'Server error',
      }),
      { status: error?.status || 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
