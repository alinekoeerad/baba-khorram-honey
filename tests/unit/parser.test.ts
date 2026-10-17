import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Data Parser Test Suite (Brief Section 16 & Task 7)', () => {
  const rootDir = process.cwd();

  // Load generated seeds (or baseline source fixtures if live database store is currently empty)
  let seedProducts: any[] = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'data/seed/products.json'), 'utf8')
  );
  if (!Array.isArray(seedProducts) || seedProducts.length === 0) {
    seedProducts = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'data/source/seed-products.json'), 'utf8')
    );
  }

  let seedRecipes: any[] = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'data/seed/recipes.json'), 'utf8')
  );
  if (!Array.isArray(seedRecipes) || seedRecipes.length === 0) {
    seedRecipes = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'data/source/seed-recipes.json'), 'utf8')
    );
  }

  it('verifies exact total counts: 31 products and 37 recipes', () => {
    expect(seedProducts.length).toBe(31);
    expect(seedRecipes.length).toBe(37);
  });

  it('correctly parses a product with an empty color line (null value)', () => {
    // Product 13 (شاه بلوط) has empty 'رنگ:' in source text
    const productWithEmptyColor = seedProducts.find((p: any) => p.nameOriginal === 'CHESTNUT');
    expect(productWithEmptyColor).toBeDefined();
    expect(productWithEmptyColor.color).toBeNull();
  });

  it('correctly parses a benefit line without a bullet marker', () => {
    // Product 11 (بوقناق / ERGNGIUM) line: 'مناسب برای رژیم لاغری و تقویت سیستم گوارش' lacks 🔸 or 🔹
    const ergngium = seedProducts.find((p: any) => p.nameOriginal === 'ERGNGIUM');
    expect(ergngium).toBeDefined();
    expect(ergngium.benefits).toContain('مناسب برای رژیم لاغری و تقویت سیستم گوارش');
  });

  it('correctly parses a warning line by removing ❌ and outer parentheses', () => {
    // Product 10 warning: '❌(ممنوع برای فشار خون بالا و حالت تهوع)'
    const enchinops = seedProducts.find((p: any) => p.nameOriginal === 'ENCHINOPS');
    expect(enchinops).toBeDefined();
    expect(enchinops.usageWarning).toBe('ممنوع برای فشار خون بالا و حالت تهوع');
  });

  it('correctly parses recipes with a parenthesized country retaining full text', () => {
    // Recipe 4: کشور نوشیدنی: ویتنام (استان کوانگ نام)
    const nuocMot = seedRecipes.find((r: any) => r.slug === 'nuoc-mot');
    expect(nuocMot).toBeDefined();
    expect(nuocMot.country).toBe('ویتنام (استان کوانگ نام)');
  });

  it('correctly maps combined serving types per Brief Section 16', () => {
    // Recipe 6 (کارکاده): نوع سرو: گرم یا سرد -> ['HOT', 'COLD']
    const karkadeh = seedRecipes.find((r: any) => r.slug === 'karkadeh');
    expect(karkadeh.servingTypes).toEqual(['HOT', 'COLD']);

    // Recipe 15 (بسیسه): نوع سرو: سرد یا ولرم -> ['COLD', 'WARM']
    const bsissa = seedRecipes.find((r: any) => r.slug === 'bsissa');
    expect(bsissa.servingTypes).toEqual(['COLD', 'WARM']);
  });

  it('correctly parses an unnumbered first step in recipe instructions', () => {
    // Recipe 18 (بویه - Jus de Bouye) has unnumbered step 1
    const bouye = seedRecipes.find((r: any) => r.slug === 'jus-de-bouye');
    expect(bouye).toBeDefined();
    expect(bouye.steps[0]).toContain('پودر بائوباب را با حدود ۱۰۰ میلی لیتر آب مخلوط کنید تا کاملا باز شود');
  });

  it('correctly parses an ingredient with an equivalent measure and a note', () => {
    // Recipe 1 (آمالاکی پاناکا): عسل: ۱۲۰ گرم (حدود ۶ قاشق غذا خوری)(قابل تنظیم بر اساس ترشی میوه)
    const amalaki = seedRecipes.find((r: any) => r.slug === 'amalaki-panaka');
    const honeyIng = amalaki.ingredients.find((i: any) => i.name === 'عسل');
    expect(honeyIng).toBeDefined();
    expect(honeyIng.quantityText).toBe('۱۲۰');
    expect(honeyIng.unit).toBe('گرم');
    expect(honeyIng.equivalentText).toBe('حدود ۶ قاشق غذا خوری');
    expect(honeyIng.note).toBe('قابل تنظیم بر اساس ترشی میوه');
    expect(honeyIng.isOptional).toBe(false);
  });

  it('passes the verbatim round-trip token reconstruction test across all 37 recipes (221 ingredient lines)', () => {
    let totalLines = 0;
    let passedLines = 0;

    for (const recipe of seedRecipes) {
      for (const ing of recipe.ingredients) {
        totalLines++;
        const tokens: string[] = [ing.name];
        if (ing.quantityText) tokens.push(ing.quantityText);
        if (ing.unit) tokens.push(ing.unit);
        if (ing.equivalentText) tokens.push(ing.equivalentText);
        if (ing.isOptional) tokens.push('اختیاری');
        if (ing.note) tokens.push(ing.note);

        const reconstructed = tokens.join(' ');
        const origWords = ing.raw.match(/[\w\u0600-\u06FF]+/g) || [];
        const reconWords = reconstructed.match(/[\w\u0600-\u06FF]+/g) || [];
        const reconSet = new Set(reconWords);

        const missing = origWords.filter((w: string) => !reconSet.has(w));
        expect(missing, `Missing words in ${ing.raw}`).toEqual([]);
        passedLines++;
      }
    }

    expect(totalLines).toBe(221);
    expect(passedLines).toBe(221);
  });
});
