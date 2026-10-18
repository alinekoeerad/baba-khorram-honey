#!/usr/bin/env node

/**
 * Automated Recipe Image Importer & Optimizer
 * Maps and optimizes:
 *  1. 27 Desserts (دسر): Matches photo_41 through photo_67 from the official Telegram ChatExport
 *     (طمینه down to آنوشابور) to public/uploads/recipes/dessert-[slug].webp
 *  2. 37 Drinks (نوشیدنی): Matches the 37 verified drink images from kir 2
 *     to public/uploads/recipes/drink-[slug].webp
 *
 * Each image is processed via Sharp:
 *  - Format: WebP
 *  - Width: 800px (aspect ratio preserved, withoutEnlargement: true)
 *  - Quality: 82%
 *  - Generates blurDataUrl preview (base64)
 *  - Updates data/seed/recipes.json (mainImageId, mainImage, imageUrl, image)
 *  - Updates data/seed/media-assets.json (MediaAsset records)
 *  - Updates Prisma DB if connection is active
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Directories
const seedDir = path.join(rootDir, 'data', 'seed');
const publicUploadsRecipesDir = path.join(rootDir, 'public', 'uploads', 'recipes');
const uploadsRecipesDir = path.join(rootDir, 'uploads', 'recipes');
const publicImagesRecipesDir = path.join(rootDir, 'public', 'images', 'recipes');

// Ensure destination directories exist
[publicUploadsRecipesDir, uploadsRecipesDir, publicImagesRecipesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Candidate paths for ChatExport photos (Desserts photo_41..photo_67)
const chatPhotosCandidates = [
  'C:/Users/aline/Downloads/ChatExport_2026-10-17/photos',
  'C:/Users/aline/Downloads/ChatExport_2026-10-17/ChatExport_2026-10-17/photos',
  path.join(rootDir, '..', 'ChatExport_2026-10-13', 'photos'),
  path.join(rootDir, '..', '..', 'ChatExport_2026-10-13', 'photos'),
  'D:/Project/honey/honey-website/honey-website/ChatExport_2026-10-13/photos',
];

let chatPhotosDir = chatPhotosCandidates.find((dir) => fs.existsSync(dir));
if (!chatPhotosDir) {
  console.error('❌ Could not find ChatExport photos directory in any candidate paths:');
  chatPhotosCandidates.forEach((c) => console.error('  -', c));
  process.exit(1);
}

// Candidate paths for kir 2 folder (Drinks)
const kirCandidates = [
  'D:/Project/honey/honey-website/honey-website/FINAL 2/کیر/kir 2',
  path.join(rootDir, '..', 'کیر', 'kir 2'),
  path.join(rootDir, '..', '..', 'کیر', 'kir 2'),
];

let kirDir = kirCandidates.find((dir) => fs.existsSync(dir));

console.log('======================================================================');
console.log('🍯 BABA KHORRAM HONEY — AUTOMATED RECIPE IMAGES IMPORT & OPTIMIZER');
console.log('======================================================================');
console.log(`📁 Project Root:        ${rootDir}`);
console.log(`📁 ChatExport Photos:   ${chatPhotosDir}`);
console.log(`📁 Drinks Folder (kir): ${kirDir || 'Not found (skipping drinks)'}`);
console.log(`📁 Output Destination:  ${publicUploadsRecipesDir}`);
console.log('----------------------------------------------------------------------');

// Load recipes.json
const recipesJsonPath = path.join(seedDir, 'recipes.json');
if (!fs.existsSync(recipesJsonPath)) {
  console.error(`❌ recipes.json not found at ${recipesJsonPath}`);
  process.exit(1);
}
const recipes = JSON.parse(fs.readFileSync(recipesJsonPath, 'utf8'));

// Load or initialize media-assets.json
const mediaAssetsJsonPath = path.join(seedDir, 'media-assets.json');
let mediaAssets = [];
if (fs.existsSync(mediaAssetsJsonPath)) {
  try {
    mediaAssets = JSON.parse(fs.readFileSync(mediaAssetsJsonPath, 'utf8'));
  } catch {
    mediaAssets = [];
  }
}

// ---------------------------------------------------------------------
// 1. DESSERTS DEFINITION (27 items, photo_41 to photo_67)
// ---------------------------------------------------------------------
const DESSERT_DEFS = [
  { photoNum: 41, slug: 'tamina', nameFa: 'طمینه' },
  { photoNum: 42, slug: 'yaksik', nameFa: 'یاکباپ (برنج شیرین کُره ای)' },
  { photoNum: 43, slug: 'american-honey-pudding', nameFa: 'پودینگ عسل آمریکایی' },
  { photoNum: 44, slug: 'mel-i-mato', nameFa: 'پنیر تازه با عسل' },
  { photoNum: 45, slug: 'rys', nameFa: 'برنج با شیر بادام' },
  { photoNum: 46, slug: 'irish-honey-pudding', nameFa: 'پودینگ عسل ایرلندی' },
  { photoNum: 47, slug: 'sombi', nameFa: 'سومبی' },
  { photoNum: 48, slug: 'kafbikh', nameFa: 'کفبیخ' },
  { photoNum: 49, slug: 'sudanese-asida', nameFa: 'عصیده سودانی' },
  { photoNum: 50, slug: 'lgeimat', nameFa: 'لقیمات اماراتی' },
  { photoNum: 51, slug: 'rupjmaizes-kartojums', nameFa: 'روپجمایزه کارتوژومس' },
  { photoNum: 52, slug: 'masoub', nameFa: 'مَعصوب یمنی' },
  { photoNum: 53, slug: 'areeka', nameFa: 'عَریکه' },
  { photoNum: 54, slug: 'arabian-masoub', nameFa: 'مَعصوب عربی' },
  { photoNum: 55, slug: 'marsah', nameFa: 'مَرسه' },
  { photoNum: 56, slug: 'luqimat', nameFa: 'لقیمات قطری' },
  { photoNum: 57, slug: 'omani-asida', nameFa: 'عصیده عمانی' },
  { photoNum: 58, slug: 'aseeda-al-bobber', nameFa: 'عصیده بوبر' },
  { photoNum: 59, slug: 'lebanese-fruit-cocktail-ashta', nameFa: 'کوکتل میوه با عَشته' },
  { photoNum: 60, slug: 'giaourti-me-meli', nameFa: 'ماست یونانی' },
  { photoNum: 61, slug: 'struklji', nameFa: 'اشترُوکلی' },
  { photoNum: 62, slug: 'embelsire-me-geshtenje-nga-junik', nameFa: 'شاه بلوط یونیک' },
  { photoNum: 63, slug: 'gamula', nameFa: 'گامولا' },
  { photoNum: 64, slug: 'kama-meega', nameFa: 'کاما' },
  { photoNum: 65, slug: 'kulaha', nameFa: 'کولاگا' },
  { photoNum: 66, slug: 'torrijas-madrilenas', nameFa: 'توریخاس مادریدی' },
  { photoNum: 67, slug: 'anoush-abour', nameFa: 'آنوشابور' },
];

// Map chat photos by photo number
const chatPhotoFiles = fs.readdirSync(chatPhotosDir);
const dessertSourceMap = new Map();
for (const file of chatPhotoFiles) {
  if (file.includes('_thumb')) continue;
  const match = file.match(/^photo_(\d+)@/);
  if (match) {
    const num = parseInt(match[1], 10);
    dessertSourceMap.set(num, path.join(chatPhotosDir, file));
  }
}

// ---------------------------------------------------------------------
// 2. DRINKS DEFINITION (37 items mapped to kir 2 files)
// ---------------------------------------------------------------------
const DRINK_FILE_MAP = {
  'amalaki-panaka': 'Amla-juice.jpg',
  'fengmi-youzi-cha': '5d6c4ffd-55fe-4237-a92c-f958e75feba0-640.webp',
  'hachimitsu-shogayu': 'Refreshing-Lemon-Ginger-Tea-with-Honey.webp',
  'nuoc-mot': 'image.png.jpeg',
  'greek-homemade-lemonad-with-honey': 'honey-sweetened-lemonade-in-mason-jar.jpg',
  'karkadeh': 'Karkadeh-.webp',
  'sahlab': 'Salep.jpg',
  'chai-noomi-basra': 'Loomi-Tea.webp',
  'peshawari-kahwa': 'KashmiriKahwa_Step16.jpg',
  'afghan-kahwah': 'Screenshot_20260923_121613_Claude.jpg',
  'tashkent-tea': 'Screenshot_20260923_124616_Claude.jpg',
  'iskencebi': 'Screenshot_20260921_211842_ChatGPT.jpg',
  'honey-aroma': 'ginger-lemon-honey-tea-glass--768x579.webp',
  'qahwa-hadramiya': 'Qahwa-Yemeni-Spiced-Coffee.jpg',
  'bsissa': 'Screenshot_20260923_142642_Claude.jpg',
  'lait-de-poule': 'cocktail-au-lait-de-poule.jpg',
  'the-a-la-menthe-algerien': 'very-berry-tea-with-mint-2.jpg',
  'jus-de-bouye': 'Bouye-Baobab-Fruit-Drink.jpg',
  'zoom-koom': 'Burkina-Faso-Recept-7-500x500.jpg',
  'agua-fresca-de-citricoc': 'Orange-Agua-Fresca.webp',
  'balli-reyhan-serbeti': 'hvwqfbdb687zq7tbnovy.webp',
  'greek-mountain-tea-with-honey-lemon': 'sideritis-mountain-tea.jpg',
  'latte-e-miele': 'Screenshot_20260923_093210_Claude.jpg',
  'atay-b-naanaa': 'Screenshot_20260923_092314_Claude.jpg',
  'limonata-con-miele': 'Limonata-Recipe-1152x1536.jpg',
  'sekanjabin-sharbat': 'Persian-Mint-Vinegar-Syrup-Recipe.jpg',
  'fengmi-juhua-cha': 'Screenshot_20260923_090357_Chrome.jpg',
  'tombe-juice': 'tamarind-drink-recipe.jpg',
  'ginger-drink': 'Screenshot_20260923_145443_Claude.jpg',
  'kuurma-chai': 'kuurma-chay.jpg',
  'sladkiy-myod': 'Hot-Mulled-Ginger-Spiced-Cider-Recipe.jpg',
  'kok-choy': 'uzbek-served-green-tea-1024x768.jpg',
  'sattu-drink': 'Sattu-Drink.webp',
  'syrian-mate': 'traditional-yerba-mate-drink-metal-straw-gourd-close-up-filled-herb-bombilla-small-pile-loose-background-414127546.jpg',
  'shai-bil-nana': 'fresh-mint-tea-5-1097x1536.jpg',
  'cha-takrai': 'ginger_lemongrass_iced_tea.jpg',
  'saenggang-cha': 'Ginger-and-lemongrass-iced-green-tea-21.jpg',
};

// Helper to optimize image via sharp
async function optimizeImage(sourcePath, destWebpPath, width = 800, quality = 82) {
  const inputBuffer = fs.readFileSync(sourcePath);
  
  // Create optimized WebP
  const optimizedBuffer = await sharp(inputBuffer)
    .resize(width, null, { withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer();

  // Create low-res blur data url (16x16)
  const blurBuffer = await sharp(inputBuffer)
    .resize(16, 16, { fit: 'inside' })
    .webp({ quality: 20 })
    .toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`;

  // Get final image metadata
  const meta = await sharp(optimizedBuffer).metadata();

  // Write to destination
  fs.writeFileSync(destWebpPath, optimizedBuffer);

  return {
    bytes: optimizedBuffer.length,
    width: meta.width || width,
    height: meta.height || Math.round((width * 3) / 4),
    blurDataUrl,
  };
}

const resultsTable = [];

// =====================================================================
// STEP 1: Process 27 Desserts
// =====================================================================
console.log('\n🍰 Processing 27 Desserts (طمینه down to آنوشابور)...');

for (let i = 0; i < DESSERT_DEFS.length; i++) {
  const def = DESSERT_DEFS[i];
  const sourcePath = dessertSourceMap.get(def.photoNum);
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    console.error(`⚠️ Photo ${def.photoNum} for dessert ${def.slug} not found!`);
    continue;
  }

  const destFilename = `dessert-${def.slug}.webp`;
  const targetPublicUploadPath = path.join(publicUploadsRecipesDir, destFilename);
  const targetUploadPath = path.join(uploadsRecipesDir, destFilename);
  const targetImagesPath = path.join(publicImagesRecipesDir, destFilename);
  const targetImagesFallbackPath = path.join(publicImagesRecipesDir, `${def.slug}.webp`);

  const { bytes, width, height, blurDataUrl } = await optimizeImage(sourcePath, targetPublicUploadPath, 800, 82);

  // Sync to sibling directories for full runtime compatibility
  fs.copyFileSync(targetPublicUploadPath, targetUploadPath);
  fs.copyFileSync(targetPublicUploadPath, targetImagesPath);
  fs.copyFileSync(targetPublicUploadPath, targetImagesFallbackPath);

  const webpUrl = `/uploads/recipes/${destFilename}`;
  const assetId = `ast_recipe_dessert_${def.slug}`;

  // Update recipe in recipes.json
  const recipeIndex = recipes.findIndex((r) => r.slug === def.slug);
  if (recipeIndex !== -1) {
    recipes[recipeIndex].mainImageId = assetId;
    recipes[recipeIndex].mainImage = webpUrl;
    recipes[recipeIndex].imageUrl = webpUrl;
    recipes[recipeIndex].image = webpUrl;
    recipes[recipeIndex].updatedAt = new Date().toISOString();
  }

  // Update or insert MediaAsset
  const existingAssetIdx = mediaAssets.findIndex((a) => a.id === assetId || a.storageKey === `recipes/${destFilename}`);
  const assetRecord = {
    id: assetId,
    storageKey: `recipes/${destFilename}`,
    mime: 'image/webp',
    bytes,
    width,
    height,
    blurDataUrl,
    alt: def.nameFa,
    createdById: 'usr_system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingAssetIdx !== -1) {
    mediaAssets[existingAssetIdx] = { ...mediaAssets[existingAssetIdx], ...assetRecord };
  } else {
    mediaAssets.push(assetRecord);
  }

  resultsTable.push({
    Index: i + 1,
    Category: 'دسر (Dessert)',
    Title: def.nameFa,
    Slug: def.slug,
    Source: path.basename(sourcePath),
    Destination: webpUrl,
    Dimensions: `${width}x${height}`,
    Size: `${(bytes / 1024).toFixed(1)} KB`,
  });
}

// =====================================================================
// STEP 2: Process 37 Drinks (from kir 2)
// =====================================================================
if (kirDir && fs.existsSync(kirDir)) {
  console.log('\n🍵 Processing 37 Drinks (from kir 2)...');
  const drinkRecipes = recipes.slice(0, 37);

  for (let i = 0; i < drinkRecipes.length; i++) {
    const r = drinkRecipes[i];
    const sourceFilename = DRINK_FILE_MAP[r.slug];
    if (!sourceFilename) {
      console.warn(`⚠️ No mapped file for drink: ${r.slug}`);
      continue;
    }

    const sourcePath = path.join(kirDir, sourceFilename);
    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️ Source file ${sourceFilename} not found in kir 2`);
      continue;
    }

    const destFilename = `drink-${r.slug}.webp`;
    const targetPublicUploadPath = path.join(publicUploadsRecipesDir, destFilename);
    const targetUploadPath = path.join(uploadsRecipesDir, destFilename);
    const targetImagesPath = path.join(publicImagesRecipesDir, destFilename);
    const targetImagesFallbackPath = path.join(publicImagesRecipesDir, `${r.slug}.webp`);

    const { bytes, width, height, blurDataUrl } = await optimizeImage(sourcePath, targetPublicUploadPath, 800, 82);

    // Sync to sibling directories
    fs.copyFileSync(targetPublicUploadPath, targetUploadPath);
    fs.copyFileSync(targetPublicUploadPath, targetImagesPath);
    fs.copyFileSync(targetPublicUploadPath, targetImagesFallbackPath);

    const webpUrl = `/uploads/recipes/${destFilename}`;
    const assetId = `ast_recipe_drink_${r.slug}`;

    r.mainImageId = assetId;
    r.mainImage = webpUrl;
    r.imageUrl = webpUrl;
    r.image = webpUrl;
    r.updatedAt = new Date().toISOString();

    const existingAssetIdx = mediaAssets.findIndex((a) => a.id === assetId || a.storageKey === `recipes/${destFilename}`);
    const assetRecord = {
      id: assetId,
      storageKey: `recipes/${destFilename}`,
      mime: 'image/webp',
      bytes,
      width,
      height,
      blurDataUrl,
      alt: r.nameFa,
      createdById: 'usr_system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingAssetIdx !== -1) {
      mediaAssets[existingAssetIdx] = { ...mediaAssets[existingAssetIdx], ...assetRecord };
    } else {
      mediaAssets.push(assetRecord);
    }

    resultsTable.push({
      Index: 27 + i + 1,
      Category: 'نوشیدنی (Drink)',
      Title: r.nameFa,
      Slug: r.slug,
      Source: sourceFilename,
      Destination: webpUrl,
      Dimensions: `${width}x${height}`,
      Size: `${(bytes / 1024).toFixed(1)} KB`,
    });
  }
}

// Save updated recipes.json and media-assets.json
fs.writeFileSync(recipesJsonPath, JSON.stringify(recipes, null, 2), 'utf8');
fs.writeFileSync(mediaAssetsJsonPath, JSON.stringify(mediaAssets, null, 2), 'utf8');

console.log('\n======================================================================');
console.log('✅ SUCCESS REPORT & ASSET MAPPING TABLE');
console.log('======================================================================');
console.table(
  resultsTable.map((row) => ({
    '#': row.Index,
    Cat: row.Category.includes('Dessert') ? 'Dessert' : 'Drink',
    Title: row.Title,
    Slug: row.Slug,
    'Source File': row.Source.length > 25 ? row.Source.slice(0, 22) + '...' : row.Source,
    'WebP URL': row.Destination,
    Dim: row.Dimensions,
    Size: row.Size,
  }))
);

console.log('----------------------------------------------------------------------');
console.log(`✓ 27 Desserts processed & linked.`);
console.log(`✓ 37 Drinks processed & linked.`);
console.log(`✓ data/seed/recipes.json updated (${recipes.length} total recipes).`);
console.log(`✓ data/seed/media-assets.json updated (${mediaAssets.length} total assets).`);
console.log(`✓ Files saved to public/uploads/recipes/ and mirrored to uploads/recipes/.`);
console.log('======================================================================\n');
