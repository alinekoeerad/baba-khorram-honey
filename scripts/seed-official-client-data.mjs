import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const seedDir = path.join(rootDir, 'data', 'seed');
const sourceDir = path.join(rootDir, 'data', 'source');
const chatPhotosDir = path.join(rootDir, 'ChatExport_2026-10-17', 'photos');
const publicProductsDir = path.join(rootDir, 'public', 'images', 'products');
const publicRecipesDir = path.join(rootDir, 'public', 'images', 'recipes');

if (!fs.existsSync(seedDir)) fs.mkdirSync(seedDir, { recursive: true });
if (!fs.existsSync(publicRecipesDir)) fs.mkdirSync(publicRecipesDir, { recursive: true });

function normalizeSearchText(text) {
  if (!text) return '';
  let normalized = text.toLowerCase();
  normalized = normalized
    .replace(/\u064A/g, '\u06CC')
    .replace(/\u0643/g, '\u06A9')
    .replace(/[\u06C0\u0629]/g, '\u0647')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627');
  normalized = normalized
    .replace(/[\u06F0\u0660]/g, '0')
    .replace(/[\u06F1\u0661]/g, '1')
    .replace(/[\u06F2\u0662]/g, '2')
    .replace(/[\u06F3\u0663]/g, '3')
    .replace(/[\u06F4\u0664]/g, '4')
    .replace(/[\u06F5\u0665]/g, '5')
    .replace(/[\u06F6\u0666]/g, '6')
    .replace(/[\u06F7\u0667]/g, '7')
    .replace(/[\u06F8\u0668]/g, '8')
    .replace(/[\u06F9\u0669]/g, '9');
  normalized = normalized.replace(/\u0640/g, '');
  normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');
  normalized = normalized.replace(/\u200C/g, ' ');
  return normalized.replace(/\s+/g, ' ').trim();
}

console.log('----------------------------------------------------');
console.log('🚀 Phase 10: Seeding 100% Official Client Dataset');
console.log('----------------------------------------------------');

// =========================================================================
// 1. Categories
// =========================================================================
console.log('📦 1. Installing Official Categories...');
const officialCategories = [
  {
    id: 'cat_honey-types',
    name: 'انواع عسل',
    slug: 'honey-types',
    type: 'PRODUCT',
    status: 'ACTIVE',
    sortOrder: 0,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  },
  {
    id: 'cat_other-bee-products',
    name: 'فرآورده‌های دیگر زنبور',
    slug: 'other-bee-products',
    type: 'PRODUCT',
    status: 'ACTIVE',
    sortOrder: 1,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  },
  {
    id: 'cat_drinks',
    name: 'نوشیدنی',
    slug: 'drinks',
    type: 'RECIPE',
    status: 'ACTIVE',
    sortOrder: 0,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  },
  {
    id: 'cat_desserts',
    name: 'دسر',
    slug: 'desserts',
    type: 'RECIPE',
    status: 'ACTIVE',
    sortOrder: 1,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  },
  {
    id: 'cat_breakfast',
    name: 'صبحانه',
    slug: 'breakfast',
    type: 'RECIPE',
    status: 'ACTIVE',
    sortOrder: 2,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  },
  {
    id: 'cat_pastries',
    name: 'کیک و شیرینی',
    slug: 'cakes-pastries',
    type: 'RECIPE',
    status: 'ACTIVE',
    sortOrder: 3,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  },
];

fs.writeFileSync(path.join(seedDir, 'categories.json'), JSON.stringify(officialCategories, null, 2), 'utf8');
console.log(`✓ Saved ${officialCategories.length} categories to data/seed/categories.json`);

// =========================================================================
// 2. Products (31 Official Client Products)
// =========================================================================
console.log('🍯 2. Processing 31 Official Products...');

const rawSourceProducts = JSON.parse(fs.readFileSync(path.join(sourceDir, 'seed-products.json'), 'utf8'));

// Exact 31 product definitions mapping
const productDefs = [
  { index: 1, slug: 'saffron', nameFa: 'عسل زعفران', nameOriginal: 'SAFFRON', aliases: [] },
  { index: 2, slug: 'berberis', nameFa: 'عسل زرشک', nameOriginal: 'BERBERRISE', aliases: ['berberrise'] },
  { index: 3, slug: 'cotton', nameFa: 'عسل پنبه', nameOriginal: 'CATTON', aliases: ['catton'] },
  { index: 4, slug: 'citrus-bigaradia', nameFa: 'عسل بهارنارنج', nameOriginal: 'CITRUS BIGARADIA', aliases: [] },
  { index: 5, slug: 'almond', nameFa: 'عسل بادام', nameOriginal: 'ALMOND', aliases: [] },
  { index: 6, slug: 'sumac', nameFa: 'عسل سماق', nameOriginal: 'SUMAC', aliases: [] },
  { index: 7, slug: 'eucalyptus', nameFa: 'عسل اکالیپتوس (کینا)', nameOriginal: 'EUCALYPTUS', aliases: [] },
  { index: 8, slug: 'nigella-sativa', nameFa: 'عسل سیاهدانه', nameOriginal: 'NIGELLA SATIVA', aliases: [] },
  { index: 9, slug: 'sesame', nameFa: 'عسل کنجد', nameOriginal: 'SESAME', aliases: [] },
  { index: 10, slug: 'echinops', nameFa: 'عسل قنقال (تیغال)', nameOriginal: 'ENCHINOPS', aliases: ['enchinops'] },
  { index: 11, slug: 'eryngium', nameFa: 'عسل بوقناق (زول)', nameOriginal: 'ERGNGIUM', aliases: ['ergngium'] },
  { index: 12, slug: 'cirsium', nameFa: 'عسل زنجیرخار (خارکیوار)', nameOriginal: 'CIRSIUM', aliases: [] },
  { index: 13, slug: 'chestnut', nameFa: 'عسل شاه بلوط', nameOriginal: 'CHESTNUT', aliases: [] },
  { index: 14, slug: 'acacia', nameFa: 'عسل اقاقیا', nameOriginal: 'ACACIA', aliases: [], color: 'کهربائی' },
  { index: 15, slug: 'officinalis', nameFa: 'عسل مریم گلی', nameOriginal: 'OFFICINALIS', aliases: [] },
  { index: 16, slug: 'alfalfa', nameFa: 'عسل یونجه', nameOriginal: 'ALFALFA', aliases: [] },
  { index: 17, slug: 'coriandrum', nameFa: 'عسل گشنیز', nameOriginal: 'CORIANDRUM', aliases: [] },
  { index: 18, slug: 'parsley', nameFa: 'عسل جعفری', nameOriginal: 'PARSLEY', aliases: [] },
  { index: 19, slug: 'dill', nameFa: 'عسل شوید', nameOriginal: 'DILL', aliases: [] },
  { index: 20, slug: 'five-finger', nameFa: 'عسل پنج انگشت (فلفل بیابانی)', nameOriginal: 'FIVE FINGER', aliases: [] },
  { index: 21, slug: 'ajwain', nameFa: 'عسل زنیان (انیسون بری)', nameOriginal: 'AJWAIN', aliases: [] },
  { index: 22, slug: 'oregano-cow', nameFa: 'عسل گاوپونه (گل اروانه)', nameOriginal: 'OREGANO COW', aliases: [] },
  { index: 23, slug: 'thymus', nameFa: 'عسل آویشن', nameOriginal: 'THYMUS', aliases: [] },
  { index: 24, slug: 'astragalus-yellow', nameFa: 'عسل گَوَن کتیرا (گَوَن زرد)', nameOriginal: 'ASTRAGALUS', aliases: ['astragalus-2'] },
  { index: 25, slug: 'foeniculum', nameFa: 'عسل رازیانه (بادیان)', nameOriginal: 'FOENICULUM', aliases: [] },
  { index: 26, slug: 'astragalus', nameFa: 'عسل گَوَن گَزاَنگبین (گَوَن گز)', nameOriginal: 'ASTAGALUS', aliases: ['astagalus', 'astragalus-gaz'] },
  { index: 27, slug: 'ziziphus', nameFa: 'عسل کُنار (سدر)', nameOriginal: 'ZIZIPHUS', aliases: [] },
  { index: 28, slug: 'jujube', nameFa: 'عسل عناب', nameOriginal: 'JUJUBE', aliases: [] },
  { index: 29, slug: 'multi-plants', nameFa: 'عسل چند گیاه', nameOriginal: 'MULTI PLANTS', aliases: [] },
  { index: 30, slug: 'pollen', nameFa: 'گرده گل', nameOriginal: 'POLLEN', aliases: [] },
  { index: 31, slug: 'royal-jelly', nameFa: 'رویال ژل', nameOriginal: 'ROYAL GELLY', aliases: ['royal-gelly'] },
];

const processedProducts = [];
const allProductOptions = [];

for (let i = 0; i < productDefs.length; i++) {
  const def = productDefs[i];
  const src = rawSourceProducts[i];
  if (!src) {
    console.error(`❌ Missing source product at index ${i}`);
    continue;
  }

  // Clean benefits
  const cleanedBenefits = (src.benefits || []).map((b) =>
    b.replace(/[\udd38\udd39\u25C6\u25C7\u2022\u25CF\-]/g, '').trim()
  ).filter(Boolean);

  // Standard Product Options
  let options = [];
  if (def.slug === 'pollen') {
    options = [
      { id: `opt_${def.slug}_250g`, productId: `prd_${def.slug}`, label: 'بسته ۲۵۰ گرمی', isAvailable: true, sortOrder: 0 },
      { id: `opt_${def.slug}_100g`, productId: `prd_${def.slug}`, label: 'بسته ۱۰۰ گرمی', isAvailable: true, sortOrder: 1 },
    ];
  } else if (def.slug === 'royal-jelly') {
    options = [
      { id: `opt_${def.slug}_50g`, productId: `prd_${def.slug}`, label: 'بسته ۵۰ گرمی خالص', isAvailable: true, sortOrder: 0 },
      { id: `opt_${def.slug}_100g`, productId: `prd_${def.slug}`, label: 'بسته ۱۰۰ گرمی خالص', isAvailable: true, sortOrder: 1 },
    ];
  } else {
    options = [
      { id: `opt_${def.slug}_1kg`, productId: `prd_${def.slug}`, label: 'یک کیلوگرم (ظرف شیشه‌ای)', isAvailable: true, sortOrder: 0 },
      { id: `opt_${def.slug}_500g`, productId: `prd_${def.slug}`, label: 'نیم کیلوگرم (ظرف شیشه‌ای)', isAvailable: true, sortOrder: 1 },
    ];
  }

  // Build options for product-options.json (include aliases)
  allProductOptions.push(...options);
  for (const alias of def.aliases) {
    if (def.slug === 'pollen') {
      allProductOptions.push(
        { id: `opt_${alias}_250g`, productId: `prd_${alias}`, label: 'بسته ۲۵۰ گرمی', isAvailable: true, sortOrder: 0 },
        { id: `opt_${alias}_100g`, productId: `prd_${alias}`, label: 'بسته ۱۰۰ گرمی', isAvailable: true, sortOrder: 1 }
      );
    } else if (def.slug === 'royal-jelly') {
      allProductOptions.push(
        { id: `opt_${alias}_50g`, productId: `prd_${alias}`, label: 'بسته ۵۰ گرمی خالص', isAvailable: true, sortOrder: 0 },
        { id: `opt_${alias}_100g`, productId: `prd_${alias}`, label: 'بسته ۱۰۰ گرمی خالص', isAvailable: true, sortOrder: 1 }
      );
    } else {
      allProductOptions.push(
        { id: `opt_${alias}_1kg`, productId: `prd_${alias}`, label: 'یک کیلوگرم (ظرف شیشه‌ای)', isAvailable: true, sortOrder: 0 },
        { id: `opt_${alias}_500g`, productId: `prd_${alias}`, label: 'نیم کیلوگرم (ظرف شیشه‌ای)', isAvailable: true, sortOrder: 1 }
      );
    }
  }

  // Ensure WebP image exists
  const jpgPath = path.join(publicProductsDir, `${def.slug}.jpg`);
  const webpPath = path.join(publicProductsDir, `${def.slug}.webp`);
  if (fs.existsSync(jpgPath) && !fs.existsSync(webpPath)) {
    try {
      const buf = fs.readFileSync(jpgPath);
      await sharp(buf).webp({ quality: 84, effort: 4, alphaQuality: 90 }).toFile(webpPath);
    } catch (e) {
      console.warn(`Could not convert ${def.slug}.jpg to webp:`, e.message);
    }
  }

  const categorySlug = def.slug === 'pollen' || def.slug === 'royal-jelly' ? 'other-bee-products' : 'honey-types';
  const categoryId = categorySlug === 'other-bee-products' ? 'cat_other-bee-products' : 'cat_honey-types';

  const searchTextParts = [
    def.nameFa,
    def.nameOriginal,
    src.foodNature,
    src.vitamins,
    src.harvestSeason,
    src.harvestPlace,
    def.color || src.color,
    src.usageWarning,
    ...cleanedBenefits,
    categorySlug === 'other-bee-products' ? 'فرآورده‌های دیگر زنبور' : 'انواع عسل',
  ];
  const searchText = normalizeSearchText(searchTextParts.filter(Boolean).join(' '));

  const prodObj = {
    id: `prd_${def.slug}`,
    index: def.index,
    slug: def.slug,
    nameFa: def.nameFa,
    nameOriginal: def.nameOriginal,
    status: 'PUBLISHED',
    isAvailable: true,
    isFeatured: i < 6,
    cardTheme: 'AUTO',
    sortOrder: i,
    foodNature: src.foodNature || null,
    vitamins: src.vitamins || null,
    harvestSeason: src.harvestSeason || null,
    harvestPlace: src.harvestPlace || null,
    color: def.color || src.color || null,
    usageWarning: src.usageWarning || null,
    benefits: cleanedBenefits,
    options,
    categorySlug,
    categoryIds: [categoryId],
    imageUrl: `/images/products/${def.slug}.webp`,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
    searchText,
  };

  processedProducts.push(prodObj);
}

fs.writeFileSync(path.join(seedDir, 'products.json'), JSON.stringify(processedProducts, null, 2), 'utf8');
fs.writeFileSync(path.join(seedDir, 'product-options.json'), JSON.stringify(allProductOptions, null, 2), 'utf8');
console.log(`✓ Saved ${processedProducts.length} official products to data/seed/products.json`);
console.log(`✓ Saved ${allProductOptions.length} product options to data/seed/product-options.json`);

// =========================================================================
// 3. Recipes (37 Drinks + 27 Desserts = 64 Official Recipes)
// =========================================================================
console.log('🍵 3. Processing 37 Drinks + 27 Desserts (64 Recipes)...');

// A. 37 Drinks
const rawSourceRecipes = JSON.parse(fs.readFileSync(path.join(sourceDir, 'seed-recipes.json'), 'utf8'));
const processedDrinks = rawSourceRecipes.map((r, idx) => {
  const slug = r.slug && r.slug.trim().length > 0 ? r.slug.trim() : 'syrian-mate';
  const id = `rcp_${slug}`;
  const imageUrl = `/images/recipe-${(idx % 6) + 1}.jpg`;

  return {
    ...r,
    id,
    slug,
    imageUrl,
    categories: ['drinks'],
    categoryIds: ['cat_drinks'],
    status: 'PUBLISHED',
    sortOrder: idx,
    isFeatured: idx < 3,
  };
});

// B. 27 Desserts
const chatMessagesHtml = fs.readFileSync(path.join(rootDir, 'ChatExport_2026-10-17', 'messages.html'), 'utf8');
const msgRegex = /<div class="text[^"]*">([\s\S]*?)<\/div>/g;
let match;
const messages = [];
while ((match = msgRegex.exec(chatMessagesHtml)) !== null) {
  const clean = match[1]
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim();
  if (clean) messages.push(clean);
}

const dessertMessages = messages.slice(44, 71); // Exact 27 dessert messages

const DESSERT_DEFS = [
  { slug: 'tamina', photoNum: 41 },
  { slug: 'yaksik', photoNum: 42 },
  { slug: 'american-honey-pudding', photoNum: 43 },
  { slug: 'mel-i-mato', photoNum: 44 },
  { slug: 'rys', photoNum: 45 },
  { slug: 'irish-honey-pudding', photoNum: 46 },
  { slug: 'sombi', photoNum: 47 },
  { slug: 'kafbikh', photoNum: 48 },
  { slug: 'sudanese-asida', photoNum: 49 },
  { slug: 'lgeimat', photoNum: 50 },
  { slug: 'rupjmaizes-kartojums', photoNum: 51 },
  { slug: 'masoub', photoNum: 52 },
  { slug: 'areeka', photoNum: 53 },
  { slug: 'arabian-masoub', photoNum: 54 },
  { slug: 'marsah', photoNum: 55 },
  { slug: 'luqimat', photoNum: 56 },
  { slug: 'omani-asida', photoNum: 57 },
  { slug: 'aseeda-al-bobber', photoNum: 58 },
  { slug: 'lebanese-fruit-cocktail-ashta', photoNum: 59 },
  { slug: 'giaourti-me-meli', photoNum: 60 },
  { slug: 'struklji', photoNum: 61 },
  { slug: 'embelsire-me-geshtenje-nga-junik', photoNum: 62 },
  { slug: 'gamula', photoNum: 63 },
  { slug: 'kama-meega', photoNum: 64 },
  { slug: 'kulaha', photoNum: 65 },
  { slug: 'torrijas-madrilenas', photoNum: 66 },
  { slug: 'anoush-abour', photoNum: 67 },
];

// Map dessert photos from ChatExport_2026-10-17/photos
const chatPhotoFiles = fs.readdirSync(chatPhotosDir);
const dessertPhotoMap = new Map();
for (const file of chatPhotoFiles) {
  if (file.includes('_thumb')) continue;
  const m = file.match(/^photo_(\d+)@/);
  if (m) {
    dessertPhotoMap.set(parseInt(m[1], 10), path.join(chatPhotosDir, file));
  }
}

const processedDesserts = [];

for (let idx = 0; idx < dessertMessages.length; idx++) {
  const raw = dessertMessages[idx];
  const def = DESSERT_DEFS[idx];
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);

  const nameFa = lines[0];
  const nameOriginal = lines[1];
  const slug = def.slug;

  let country = '';
  let yieldText = null;
  const ingredients = [];
  const steps = [];

  let section = 'HEADER';

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('خاستگاه:') || line.startsWith('کشور خاستگاه:')) {
      country = line.replace(/^(خاستگاه|کشور خاستگاه):\s*/, '').trim();
      continue;
    }

    if (line.startsWith('نوع دسر:')) {
      continue;
    }

    if (line.startsWith('مواد لازم')) {
      section = 'INGREDIENTS';
      const m = line.match(/\((.*?)\)/);
      if (m) {
        yieldText = m[1].replace(/برای\s*/, '').trim();
      }
      continue;
    }

    if (line.startsWith('دستور تهیه') || line.startsWith('طرز تهیه')) {
      section = 'STEPS';
      continue;
    }

    if (section === 'INGREDIENTS') {
      const colonIdx = line.indexOf(':');
      let ingName = line;
      let ingAmount = '';
      if (colonIdx !== -1) {
        ingName = line.slice(0, colonIdx).trim().replace(/^[\d\u06F0-\u06F9]+:\s*/, '');
        ingAmount = line.slice(colonIdx + 1).trim();
      }
      ingredients.push({
        name: ingName,
        quantityText: ingAmount,
        unit: '',
        equivalentText: null,
        isOptional: false,
        note: null,
        isLowConfidence: false,
        raw: line,
      });
    } else if (section === 'STEPS') {
      const cleanStep = line.replace(/^[\d\u06F0-\u06F9]+[:\.\-]\s*/, '').trim();
      if (cleanStep) {
        steps.push(cleanStep);
      }
    }
  }

  // Copy and convert dessert photo
  const photoSrc = dessertPhotoMap.get(def.photoNum);
  const destWebp = path.join(publicRecipesDir, `${slug}.webp`);
  const destJpg = path.join(publicRecipesDir, `${slug}.jpg`);

  if (photoSrc && fs.existsSync(photoSrc)) {
    try {
      const buf = fs.readFileSync(photoSrc);
      await sharp(buf).webp({ quality: 84, effort: 4, alphaQuality: 90 }).toFile(destWebp);
      fs.copyFileSync(photoSrc, destJpg);
    } catch (e) {
      console.warn(`Could not optimize recipe photo ${slug}:`, e.message);
    }
  }

  const searchTextParts = [
    nameFa,
    nameOriginal,
    country,
    yieldText,
    ...ingredients.map((ing) => ing.name),
    'دسر',
  ];
  const searchText = normalizeSearchText(searchTextParts.filter(Boolean).join(' '));

  processedDesserts.push({
    id: `rcp_${slug}`,
    index: 38 + idx,
    slug,
    nameFa,
    nameOriginal,
    country,
    servingTypes: ['WARM', 'COLD'],
    yieldText,
    status: 'PUBLISHED',
    isFeatured: idx < 3,
    cardTheme: 'AUTO',
    sortOrder: 37 + idx,
    ingredients,
    steps,
    categories: ['desserts'],
    categoryIds: ['cat_desserts'],
    shortDescription: `دسر اصیل و سنتی ${nameFa} برگرفته از خاستگاه ${country || 'جهان'} با طعم بی‌نظیر عسل طبیعی.`,
    longDescription: `این دسر لذیذ سنتی (${nameOriginal}) یکی از شاهکارهای قنادی و دسرهای اصیل خاستگاه ${country || 'جهان'} است که با شیرینی طبیعی عسل تهیه شده و سرشار از طعم و انرژی طبیعی است.`,
    imageUrl: `/images/recipes/${slug}.webp`,
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
    searchText,
  });
}

const allRecipes = [...processedDrinks, ...processedDesserts];
fs.writeFileSync(path.join(seedDir, 'recipes.json'), JSON.stringify(allRecipes, null, 2), 'utf8');
console.log(`✓ Saved ${allRecipes.length} total recipes (37 Drinks + 27 Desserts) to data/seed/recipes.json`);

// =========================================================================
// 4. Slug Redirects
// =========================================================================
console.log('🔀 4. Updating Slug Redirects...');
const existingRedirects = fs.existsSync(path.join(seedDir, 'slug-redirects.json'))
  ? JSON.parse(fs.readFileSync(path.join(seedDir, 'slug-redirects.json'), 'utf8'))
  : [];

const newRedirects = [
  { oldSlug: 'berberrise', targetId: 'prd_berberis', entityType: 'PRODUCT' },
  { oldSlug: 'catton', targetId: 'prd_cotton', entityType: 'PRODUCT' },
  { oldSlug: 'enchinops', targetId: 'prd_echinops', entityType: 'PRODUCT' },
  { oldSlug: 'ergngium', targetId: 'prd_eryngium', entityType: 'PRODUCT' },
  { oldSlug: 'astragalus-2', targetId: 'prd_astragalus-yellow', entityType: 'PRODUCT' },
  { oldSlug: 'astragalus-yellow', targetId: 'prd_astragalus-yellow', entityType: 'PRODUCT' },
  { oldSlug: 'astagalus', targetId: 'prd_astragalus', entityType: 'PRODUCT' },
  { oldSlug: 'astragalus-gaz', targetId: 'prd_astragalus', entityType: 'PRODUCT' },
  { oldSlug: 'royal-gelly', targetId: 'prd_royal-jelly', entityType: 'PRODUCT' },
  { oldSlug: 'greek-homemade-lemonad-with-honey', targetId: 'rcp_greek-homemade-lemonade-with-honey', entityType: 'RECIPE' },
  { oldSlug: 'agua-fresca-de-citricoc', targetId: 'rcp_agua-fresca-de-citricos', entityType: 'RECIPE' },
];

for (const nr of newRedirects) {
  if (!existingRedirects.some((r) => r.oldSlug === nr.oldSlug && r.entityType === nr.entityType)) {
    existingRedirects.push({
      id: `red_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: nr.entityType,
      oldSlug: nr.oldSlug,
      targetId: nr.targetId,
      createdAt: new Date().toISOString(),
    });
  }
}

fs.writeFileSync(path.join(seedDir, 'slug-redirects.json'), JSON.stringify(existingRedirects, null, 2), 'utf8');
console.log(`✓ Saved ${existingRedirects.length} slug redirects to data/seed/slug-redirects.json`);

console.log('====================================================');
console.log('🎉 100% Client Dataset Seed Pass Complete!');
console.log(`- Categories: ${officialCategories.length}`);
console.log(`- Products: ${processedProducts.length}`);
console.log(`- Product Options: ${allProductOptions.length}`);
console.log(`- Recipes: ${allRecipes.length} (37 Drinks + 27 Desserts)`);
console.log('====================================================');
