/**
 * Import script for 22 international & Iranian breakfast/pastry honey recipes
 * from ChatExport_2026-11-26.
 *
 * - Optimizes source JPGs (photo_1..photo_22) with sharp into WebP (max 800px, q=82)
 *   plus 16x16 WebP blurDataUrl
 * - Writes files to public/uploads/recipes/, uploads/recipes/, and public/images/recipes/
 * - Upserts MediaAsset records into data/seed/media-assets.json
 * - Upserts Recipe records into data/seed/recipes.json without overwriting existing recipes
 *
 * Run: node scripts/import-breakfast-recipes.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const PHOTOS_DIR =
  'C:\\Users\\aline\\.gemini\\antigravity\\brain\\6c40d272-0f41-474a-9170-93fbe4642a86\\scratch\\chat-export\\ChatExport_2026-11-26\\photos';
const RECIPES_JSON_PATH = path.join(ROOT, 'data', 'seed', 'recipes.json');
const ASSETS_JSON_PATH = path.join(ROOT, 'data', 'seed', 'media-assets.json');

const OUT_DIRS = [
  path.join(ROOT, 'public', 'uploads', 'recipes'),
  path.join(ROOT, 'uploads', 'recipes'),
  path.join(ROOT, 'public', 'images', 'recipes'),
];

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function normalizeSearchText(input) {
  if (!input) return '';
  let s = input
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/ۀ/g, 'ه')
    .replace(/أ|إ|آ/g, 'ا')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/\u200c/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ');
  for (let i = 0; i < PERSIAN_DIGITS.length; i++) {
    s = s.replaceAll(PERSIAN_DIGITS[i], String(i));
  }
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function buildIng(name, quantityText, unit, equivalentText = null, isOptional = false, note = null) {
  const parts = [name];
  if (quantityText || unit) {
    parts.push(': ', [quantityText, unit].filter(Boolean).join(' '));
  }
  if (equivalentText) parts.push(` (${equivalentText})`);
  if (note) parts.push(` (${note})`);
  return {
    name,
    quantityText,
    unit,
    equivalentText,
    isOptional,
    note,
    isLowConfidence: false,
    raw: parts.join('').trim(),
  };
}

const NEW_RECIPES = [
  {
    photoPrefix: 'photo_1@',
    id: 'rcp_khameh-asal',
    slug: 'khameh-asal',
    nameFa: 'خامه عسل',
    nameOriginal: 'Khameh Asal',
    country: 'ایران',
    servingTypes: ['COLD', 'WARM'],
    yieldText: 'برای ۲ نفر',
    shortDescription: 'صبحانه اصیل و مقوی ایرانی با ترکیب خامه یا سرشیر تازه، عسل طبیعی و نان گرم.',
    categories: ['breakfast'],
    categoryIds: ['cat_breakfast'],
    ingredients: [
      buildIng('عسل', '۴', 'قاشق غذاخوری'),
      buildIng('سرشیر یا خامه غلیظ', '⅓', 'پیمانه', 'حدود ۸۰ میلی‌لیتر'),
      buildIng('نان ساده', '۲', 'عدد'),
    ],
    steps: [
      'سرشیر یا خامه غلیظ را در ظرفی کوچک بریزید.',
      'عسل را در ظرف جداگانه قرار دهید.',
      'نان‌ها را به آرامی گرم کنید (نیازی به برشته کردن یا خشک شدن آن‌ها نیست).',
      'سرشیر و عسل را با یکدیگر مخلوط کنید تا ترکیبی یکنواخت به دست آید.',
      'مخلوط را روی نان گرم بمالید و بلافاصله سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_2@',
    id: 'rcp_creamy-honey-oats',
    slug: 'creamy-honey-oats',
    nameFa: 'اوتمیل عسلی خامه‌ای',
    nameOriginal: 'Creamy Honey Oats',
    country: 'بنگلادش',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۲ نفر',
    shortDescription: 'اوتمیل گرم و مغذی با جو دوسر پرک، شیر، دارچین و عسل طبیعی.',
    categories: ['breakfast'],
    categoryIds: ['cat_breakfast'],
    ingredients: [
      buildIng('جو دو سر پرک درشت', '¾', 'پیمانه'),
      buildIng('آب', '۱/۵', 'پیمانه'),
      buildIng('شیر', 'نصف', 'پیمانه'),
      buildIng('عسل', '۲', 'قاشق غذاخوری'),
      buildIng('نمک', 'به مقدار بسیار کم', ''),
      buildIng('دارچین', 'مقدار کم', ''),
    ],
    steps: [
      'جو دوسر پرک، آب، نمک و دارچین را در قابلمه بریزید.',
      'مخلوط را روی حرارت ملایم قرار دهید و حدود ۳ تا ۵ دقیقه بپزید تا بیشتر آب جذب جو دوسر پرک شود.',
      'شیر را اضافه کنید و هم بزنید.',
      'عسل را اضافه کرده و ۳ تا ۵ دقیقه دیگر روی حرارت ملایم بپزید.',
      'قابلمه را از روی حرارت بردارید و اجازه دهید حدود ۵ دقیقه استراحت کند تا غلظت مناسبی پیدا کند.',
      'در ظرف مناسب سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_3@',
    id: 'rcp_bal-kaymak',
    slug: 'bal-kaymak',
    nameFa: 'بال کایماک (عسل و سرشیر)',
    nameOriginal: 'Bal Kaymak',
    country: 'ترکیه (با سابقه در آشپزی دربار عثمانی)',
    servingTypes: ['COLD', 'WARM'],
    yieldText: 'برای ۲ نفر',
    shortDescription: 'صبحانه کلاسیک و پرطرفدار ترکیه‌ای با سرشیر خنک، عسل طبیعی و نان سیمیت تازه.',
    categories: ['breakfast'],
    categoryIds: ['cat_breakfast'],
    ingredients: [
      buildIng('کایماک (سرشیر غلیظ)', '۴', 'قاشق غذاخوری'),
      buildIng('عسل', '۲', 'قاشق غذاخوری'),
      buildIng('نان تازه یا سیمیت ترکی', '۲', 'عدد کوچک'),
    ],
    steps: [
      'کایماک را مستقیماً از یخچال خارج کنید و در دو بشقاب کوچک قرار دهید.',
      'عسل را به آرامی روی کایماک بریزید.',
      'در صورت تمایل مقداری عسل را در ظرف جداگانه کنار صبحانه قرار دهید.',
      'همراه نان تازه یا سیمیت سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_4@',
    id: 'rcp_feteer-meshaltet',
    slug: 'feteer-meshaltet',
    nameFa: 'فتیر مِشَلتِت',
    nameOriginal: 'Feteer Meshaltet',
    country: 'مصر',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۶ نفر',
    shortDescription: 'نان سنتی هزارلای مصری پخته‌شده با کره حیوانی و سرو شده همراه عسل طبیعی.',
    categories: ['breakfast', 'cakes-pastries'],
    categoryIds: ['cat_breakfast', 'cat_pastries'],
    ingredients: [
      buildIng('آرد سفید گندم', '۵۰۰', 'گرم'),
      buildIng('آرد اضافه برای سطح کار', 'به میزان لازم', ''),
      buildIng('آب ولرم', '۳۲۰', 'میلی‌لیتر'),
      buildIng('نمک', '۱', 'قاشق چای‌خوری'),
      buildIng('کره حیوانی یا روغن حیوانی صاف‌شده', '۱۸۰', 'گرم'),
      buildIng('روغن مایع', '۲', 'قاشق غذاخوری'),
      buildIng('عسل', 'به مقدار لازم', ''),
    ],
    steps: [
      'آرد، نمک و آب ولرم را مخلوط کنید و ۸ تا ۱۰ دقیقه ورز دهید تا خمیر نرم و یکدستی حاصل شود.',
      'خمیر را به ۶ قسمت تقسیم کنید، سطح آن‌ها را کمی چرب کنید و ۳۰ دقیقه استراحت دهید.',
      'هر قسمت را روی سطح چرب‌شده بسیار نازک باز کنید.',
      'سطح خمیر را با کره یا روغن حیوانی چرب کنید و لبه‌ها را به سمت مرکز تا بزنید تا شکل مربعی پیدا کند.',
      '۲ خمیر تا خورده را روی هم قرار دهید تا لایه‌های فتیر شکل بگیرند.',
      '۲۰ تا ۳۰ دقیقه دیگر استراحت دهید.',
      'فر را روی ۲۳۰ درجه سانتی‌گراد گرم کنید.',
      'فتیرها را در سینی داغ قرار دهید و حدود ۲۰ تا ۲۵ دقیقه بپزید تا طلایی شوند.',
      'پس از پخت، ۵ دقیقه استراحت دهید و همراه عسل سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_5@',
    id: 'rcp_msemen',
    slug: 'msemen',
    nameFa: 'نان مسمن',
    nameOriginal: 'Msemen',
    country: 'مراکش',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۶ نفر',
    shortDescription: 'نان تابه‌ای لایه‌دار مراکشی با آرد سمولینا و کره که با عسل طبیعی سرو می‌شود.',
    categories: ['breakfast', 'cakes-pastries'],
    categoryIds: ['cat_breakfast', 'cat_pastries'],
    ingredients: [
      buildIng('آرد گندم', '۲۵۰', 'گرم'),
      buildIng('آرد سمولینا', '۲۵۰', 'گرم'),
      buildIng('آب ولرم', '۲۵۰', 'میلی‌لیتر'),
      buildIng('نمک', '۱', 'پنس'),
      buildIng('کره', '۱۵۰', 'گرم'),
      buildIng('روغن زیتون', 'نصف', 'پیمانه'),
      buildIng('عسل', 'به میزان لازم', ''),
    ],
    steps: [
      'آرد گندم، آرد سمولینا و نمک را مخلوط کنید.',
      'آب ولرم را به تدریج اضافه کنید و ورز دهید تا خمیر یکدست و لطیفی حاصل شود.',
      'خمیر را به ۶ قسمت تقسیم کنید و روی آن‌ها روغن بمالید.',
      '۱۵ دقیقه استراحت دهید.',
      'هر قسمت را روی سطح چرب‌شده بسیار نازک باز کنید.',
      'سطح خمیر را با مخلوط کره ذوب‌شده و روغن زیتون چرب کنید و به شکل مربع تا بزنید.',
      'در تابه چرب‌شده، هر طرف را بپزید تا طلایی شود.',
      'همراه عسل سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_6@',
    id: 'rcp_moroccan-baghrir',
    slug: 'moroccan-baghrir',
    nameFa: 'بغریر مراکشی',
    nameOriginal: 'Moroccan Baghrir',
    country: 'مراکش',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای حدود ۱۲ عدد',
    shortDescription: 'پنکیک سنتی هزارسوراخ مراکشی با سس گرم کره، عسل طبیعی و عطر بهارنارنج.',
    categories: ['breakfast', 'cakes-pastries'],
    categoryIds: ['cat_breakfast', 'cat_pastries'],
    ingredients: [
      buildIng('آرد سمولینا نرم', '۲۵۰', 'گرم'),
      buildIng('آرد سفید گندم', '۱۰۰', 'گرم'),
      buildIng('خمیرمایه خشک فعال', '۱', 'قاشق غذاخوری', 'حدود ۱۵ گرم'),
      buildIng('بیکینگ پودر', '۱', 'قاشق غذاخوری'),
      buildIng('شکر', '۱', 'قاشق چای‌خوری'),
      buildIng('نمک', 'نصف', 'قاشق چای‌خوری'),
      buildIng('آب ولرم', '۵۰۰', 'میلی‌لیتر'),
      buildIng('کره بدون نمک', '۸۰', 'گرم'),
      buildIng('عسل', '۸۰', 'گرم'),
      buildIng('عرق بهارنارنج', '۱', 'قاشق غذاخوری', null, true),
    ],
    steps: [
      'سمولینا، آرد سفید، خمیرمایه، شکر و نمک را داخل مخلوط‌کن بریزید.',
      'آب ولرم را اضافه کنید و حدود ۲ دقیقه مخلوط کنید تا مایه‌ای صاف و نسبتاً رقیق به دست آید.',
      'بیکینگ پودر را اضافه کنید و حدود ۳۰ ثانیه دیگر مخلوط کنید.',
      'مایه را در ظرفی بریزید، روی آن را بپوشانید و در محیط نسبتاً گرم به مدت ۱۵ تا ۲۰ دقیقه استراحت دهید تا حباب‌هایی روی سطح آن ظاهر شود.',
      'تابه نچسب را روی حرارت متوسط قرار دهید. تابه باید بدون روغن باشد.',
      '۱ ملاقه از مایه را وسط تابه بریزید و اجازه دهید خودش در سطح تابه پخش شود.',
      'پنکیک را فقط از یک طرف بپزید. با ظاهر شدن سوراخ‌های متعدد روی سطح و خشک شدن قسمت بالایی، بغریر آماده است؛ آن را برنگردانید.',
      'کره را روی حرارت ملایم ذوب کنید و عسل را به آن اضافه کنید؛ در صورت تمایل عرق بهارنارنج را نیز بیفزایید.',
      'مخلوط کره و عسل را روی بغریرهای گرم بریزید و سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_7@',
    id: 'rcp_bsissa-breakfast',
    slug: 'bsissa-breakfast',
    nameFa: 'بسیسه با ماست و خرما',
    nameOriginal: 'Bsissa',
    country: 'تونس',
    servingTypes: ['COLD', 'WARM'],
    yieldText: 'برای ۲ نفر',
    shortDescription: 'صبحانه سنتی تونسی با آرد غلات برشته بسیسه، عسل، روغن زیتون، ماست، خرما و بادام بوداده.',
    categories: ['breakfast'],
    categoryIds: ['cat_breakfast'],
    ingredients: [
      buildIng('پودر بسیسه آماده (ترکیب غلات و نخود برشته و آسیاب‌شده)', '۱۰۰', 'گرم'),
      buildIng('روغن زیتون فرابکر', '۴۰', 'گرم'),
      buildIng('عسل', '۲۵', 'گرم'),
      buildIng('نمک نرم', '۰/۳', 'گرم'),
      buildIng('ماست ساده کم‌چرب', '۳۰۰', 'گرم'),
      buildIng('خرمای بدون هسته', '۸۰', 'گرم'),
      buildIng('بادام خام با پوست', '۲۰', 'گرم'),
    ],
    steps: [
      'بادام‌ها را در تابه خشک روی حرارت متوسط حدود ۳ تا ۴ دقیقه تفت دهید تا عطر آن‌ها آزاد شود، سپس کنار بگذارید تا خنک شوند.',
      'پودر بسیسه را همراه نمک در یک کاسه بریزید.',
      '¾ روغن زیتون را اضافه کنید و با پشت قاشق یا نوک انگشتان مخلوط کنید تا پودر حالت شن مرطوب پیدا کند.',
      'عسل را با حرارت باقی‌مانده تابه کمی روان کنید (نیازی به جوشاندن نیست).',
      'عسل را به مخلوط بسیسه اضافه کنید و ۱ تا ۲ دقیقه ورز دهید تا خمیر نسبتاً منسجمی به دست آید.',
      'اگر مخلوط هنوز خشک و پودری بود، مقدار باقی‌مانده روغن زیتون را به تدریج اضافه کنید.',
      'خرماها را بدون هسته و به قطعات کوچک خرد کنید. بادام‌های خنک‌شده را نیز درشت خرد کنید.',
      'ماست را بین ۲ کاسه تقسیم کنید.',
      'خمیر بسیسه را به ۲ قسمت تقسیم کرده و روی ماست قرار دهید.',
      'خرما و بادام خردشده را روی آن بریزید و باقی‌مانده روغن زیتون را به صورت قطره‌ای اضافه کنید.',
      'بلافاصله سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_8@',
    id: 'rcp_algerian-baghrir',
    slug: 'algerian-baghrir',
    nameFa: 'بغریر الجزایری',
    nameOriginal: 'Algerian Baghrir',
    country: 'الجزایر',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۱۵ عدد',
    shortDescription: 'پنکیک اسفنجی الجزایری با آرد سمولینا و کرم نرم کره و عسل.',
    categories: ['breakfast', 'cakes-pastries'],
    categoryIds: ['cat_breakfast', 'cat_pastries'],
    ingredients: [
      buildIng('آرد سمولینای نرم', '۴۰۰', 'گرم'),
      buildIng('خمیرمایه خشک', '۷', 'گرم'),
      buildIng('بیکینگ پودر', '۱', 'قاشق چای‌خوری'),
      buildIng('شکر دانه‌ریز', '۲', 'قاشق غذاخوری'),
      buildIng('آرد سفید گندم', '۲', 'قاشق غذاخوری'),
      buildIng('آب ولرم', '۷۵۰', 'میلی‌لیتر'),
      buildIng('کره بدون نمک', '۱۰۰', 'گرم'),
      buildIng('عسل', '۹۰', 'گرم'),
      buildIng('روغن مایع برای چرب کردن سطح تابه', 'به میزان لازم', ''),
    ],
    steps: [
      'آرد سمولینا، خمیرمایه خشک، بیکینگ پودر، شکر و آرد سفید را در غذاساز بریزید.',
      'آب ولرم را اضافه کنید و مواد را مخلوط کنید تا مایه‌ای کاملاً صاف و یکدست حاصل شود.',
      'مایه را به ظرف بزرگی منتقل کنید و روی آن را با پارچه تمیز بپوشانید.',
      'ظرف را به مدت ۴۵ دقیقه در محیط گرم و دور از جریان هوا قرار دهید تا حجم مایه تقریباً دو برابر شود و سطح آن پر از حباب شود.',
      'کره نرم‌شده و عسل را در غذاساز یا همزن مخلوط کنید تا ترکیبی یکنواخت و کرمی به دست آید.',
      'تابه را روی حرارت متوسط قرار دهید و با قلم‌مو لایه بسیار نازکی از روغن روی آن بمالید.',
      'نصف پیمانه از مایه را داخل تابه بریزید و اجازه دهید حدود ۲ دقیقه بپزد تا حباب‌های روی سطح آن ظاهر شود.',
      'پنکیک را برگردانید و طرف دیگر را نیز حدود ۲ دقیقه بپزید تا طلایی شود.',
      'سایر پنکیک‌ها را به همین روش آماده کنید.',
      'بغریرهای گرم را با کره و عسل آماده شده سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_9@',
    id: 'rcp_libyan-asida',
    slug: 'libyan-asida',
    nameFa: 'عصیده لیبیایی',
    nameOriginal: 'Libyan Asida',
    country: 'لیبی',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۶ نفر',
    shortDescription: 'دسر و صبحانه گرم سنتی لیبی با خمیر پخته گندم، کره ذوب‌شده و عسل طبیعی.',
    categories: ['breakfast'],
    categoryIds: ['cat_breakfast'],
    ingredients: [
      buildIng('آرد سفید گندم', '۴۰۰', 'گرم'),
      buildIng('آب', '۹۰۰', 'میلی‌لیتر'),
      buildIng('نمک نرم', 'نصف', 'قاشق چای‌خوری'),
      buildIng('کره بدون نمک', '۸۰', 'گرم'),
      buildIng('کره برای چرب کردن ظرف', '۲۰', 'گرم'),
      buildIng('عسل', '۱۸۰', 'گرم'),
      buildIng('عرق بهارنارنج', '۱', 'قاشق چای‌خوری', null, true),
      buildIng('بادام خرد شده یا کنجد بوداده', '۳۰', 'گرم', null, true),
    ],
    steps: [
      'ابتدا آرد را الک کنید و کنار بگذارید.',
      'حدود ۸۰۰ میلی‌لیتر آب را همراه نمک در قابلمه‌ای ضخیم بریزید و روی حرارت قرار دهید تا به جوش ملایم برسد. ۱۰۰ میلی‌لیتر آب باقی‌مانده را جداگانه گرم نگه دارید.',
      'آرد را به تدریج به آب اضافه کنید و همزمان با همزن دستی محکم هم بزنید تا گلوله نشود.',
      'هنگامی که مخلوط غلیظ شد، همزن را با قاشق چوبی محکم جایگزین کنید.',
      'خمیر را روی حرارت ملایم حدود ۱۸ تا ۲۲ دقیقه بپزید. در این مدت مرتب آن را به دیواره قابلمه فشار دهید و دوباره به مرکز برگردانید.',
      'اگر خمیر بیش از اندازه سفت شد یا ترک برداشت، از آب گرم ذخیره‌شده به تدریج اضافه کنید.',
      'حدود ۳۰ گرم از کره ذوب‌شده را به خمیر اضافه کنید و ۳ تا ۴ دقیقه دیگر هم بزنید تا خمیر یکدست، براق و منسجم شود.',
      'ظرف سرو را با کره چرب کنید و عصیده را داخل آن قرار دهید و سطح آن را با کاردک مرطوب صاف کنید.',
      'با پشت قاشق در مرکز عصیده یک گودی ایجاد کنید.',
      'عسل را روی حرارت بسیار ملایم کمی گرم کنید (نباید بجوشد). در صورت تمایل عرق بهارنارنج را اضافه کنید.',
      'باقی‌مانده کره ذوب‌شده و عسل گرم را داخل گودی بریزید.',
      'بادام خرد شده یا کنجد بوداده را روی آن بپاشید و بلافاصله به صورت گرم سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_10@',
    id: 'rcp_bint-al-sahn',
    slug: 'bint-al-sahn',
    nameFa: 'بِنت الصَحن',
    nameOriginal: 'Bint al-Sahn',
    country: 'یمن',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۴ تا ۶ نفر',
    shortDescription: 'کیک لایه‌لایه عسلی معروف یمن با لایه‌های نازک خمیر، روغن حیوانی، سیاه‌دانه و عسل فراوان.',
    categories: ['breakfast', 'cakes-pastries'],
    categoryIds: ['cat_breakfast', 'cat_pastries'],
    ingredients: [
      buildIng('آرد گندم', '۴', 'پیمانه'),
      buildIng('تخم‌مرغ', '۳ عدد کامل و ۱ عدد زرده', ''),
      buildIng('آب', '۱/۵', 'پیمانه'),
      buildIng('روغن حیوانی یا کره ذوب‌شده', '¾', 'پیمانه'),
      buildIng('خمیرمایه', '۱', 'قاشق غذاخوری'),
      buildIng('شکر', '۱', 'قاشق غذاخوری'),
      buildIng('شیر خشک', '۱', 'قاشق غذاخوری'),
      buildIng('نمک', '¼', 'قاشق چای‌خوری'),
      buildIng('وانیل', '¼', 'قاشق چای‌خوری'),
      buildIng('کنجد سیاه', 'به میزان لازم', 'برای تزئین'),
      buildIng('عسل', 'به میزان لازم', 'برای سرو'),
    ],
    steps: [
      'فر را روی ۲۰۰ درجه سانتی‌گراد تنظیم کنید.',
      'خمیرمایه را با ¼ پیمانه آب ولرم مخلوط کنید و چند دقیقه کنار بگذارید تا فعال شود.',
      'آرد و نمک را در ظرفی مخلوط کنید. در ظرفی دیگر تخم‌مرغ‌ها، شکر، شیر خشک، روغن حیوانی، ۱ پیمانه آب و خمیرمایه فعال‌شده را با هم ترکیب کنید.',
      'مواد مایع را به آرد اضافه کنید و حدود ۱۵ دقیقه ورز دهید تا خمیر نرم و یکدستی حاصل شود.',
      'خمیر را بپوشانید و حدود ۳۰ دقیقه استراحت دهید.',
      'خمیر را به ۱۲ تا ۱۵ قسمت تقسیم کنید و هر قسمت را به شکل گلوله درآورید. روی آن‌ها را بپوشانید و ۱۵ تا ۳۰ دقیقه دیگر استراحت دهید.',
      'هر گلوله را تا حد امکان نازک باز کنید. لایه نخست را در ظرف گرد چرب‌شده قرار دهید و روی آن روغن حیوانی بمالید. همین کار را برای لایه‌های بعدی تکرار کنید و آن‌ها را روی یکدیگر قرار دهید.',
      'روی آخرین لایه، زرده تخم‌مرغ و وانیل بمالید و کنجد سیاه بپاشید.',
      'ظرف را به مدت ۲۵ تا ۴۰ دقیقه در فر قرار دهید تا سطح نان طلایی شود.',
      'پس از خارج کردن از فر در حالی که هنوز گرم است عسل را روی آن بریزید و به شکل برش‌های مثلثی سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_11@',
    id: 'rcp_southern-areeka',
    slug: 'southern-areeka',
    nameFa: 'عریکه جنوبی',
    nameOriginal: 'Southern Areeka',
    country: 'عربستان سعودی (منطقه عسیر و جنوب عربستان)',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۴ نفر',
    shortDescription: 'صبحانه پرانرژی عسیر با نان تنوری گندم، خرما، هل، روغن حیوانی و عسل طبیعی.',
    categories: ['breakfast'],
    categoryIds: ['cat_breakfast'],
    ingredients: [
      buildIng('آرد گندم', '۳۰۰', 'گرم'),
      buildIng('آب ولرم', '۲۰۰', 'میلی‌لیتر'),
      buildIng('نمک', '۳', 'گرم'),
      buildIng('خمیرمایه فوری', '۴', 'گرم'),
      buildIng('خرمای نرم و بدون هسته', '۲۰۰', 'گرم'),
      buildIng('روغن حیوانی یا سمن محلی', '۷۰', 'گرم'),
      buildIng('عسل', '۴۰', 'گرم'),
      buildIng('هل آسیاب‌شده', '۱', 'گرم'),
      buildIng('خامه سرشیر یا کره برای تزئین', '۳۰', 'گرم', null, true),
    ],
    steps: [
      'آرد، نمک و خمیرمایه را با آب ولرم مخلوط کنید و ورز دهید تا خمیر نرمی حاصل شود. خمیر را حدود ۳۰ دقیقه استراحت دهید.',
      'خمیر را به ۲ قسمت تقسیم کنید و هر قسمت را به شکل نان گرد باز کنید. نان‌ها را روی ساج یا در فر بپزید تا کاملاً پخته و روی سطح آن‌ها لکه‌های طلایی ایجاد شود.',
      'نان‌های داغ را خرد کنید و داخل ظرف گودی بریزید. خرماهای نرم و بدون هسته را به قطعات کوچک تقسیم کرده و به نان اضافه کنید.',
      'نان و خرما را با دست یا گوشت‌کوب چوبی به هم بفشارید و ورز دهید تا خرما در بافت نان پخش شود و مخلوطی یکدست به دست آید.',
      'نصف روغن حیوانی ذوب‌شده را همراه هل اضافه کنید و مواد را مخلوط کنید تا بافتی نرم و منسجم پیدا کند.',
      'مخلوط را در ظرف سرو به شکل تپه‌ای گرد درآورید و در مرکز آن حفره‌ای ایجاد کنید.',
      'باقی‌مانده روغن حیوانی و عسل را داخل حفره بریزید و در صورت تمایل با خامه سرشیر یا کره تزئین کنید.',
      'عریکه را گرم سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_12@',
    id: 'rcp_rigag',
    slug: 'rigag',
    nameFa: 'رِقاق',
    nameOriginal: 'Rigag',
    country: 'امارات متحده عربی',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۴ نفر',
    shortDescription: 'نان بسیار نازک و ترد اماراتی پخته‌شده روی تابه تخت، همراه با روغن حیوانی، عسل و کنجد.',
    categories: ['breakfast', 'cakes-pastries'],
    categoryIds: ['cat_breakfast', 'cat_pastries'],
    ingredients: [
      buildIng('آرد سفید', '۱/۵', 'پیمانه'),
      buildIng('آب', '۲', 'پیمانه', 'حدود ۴۸۰ میلی‌لیتر'),
      buildIng('نمک', 'نصف', 'قاشق چای‌خوری'),
      buildIng('عسل', '۴', 'قاشق غذاخوری'),
      buildIng('روغن حیوانی یا روغن مایع برای چرب کردن صفحه', 'به میزان لازم', ''),
      buildIng('روغن حیوانی ذوب‌شده برای روی نان', 'به میزان دلخواه', '', null, true),
      buildIng('کنجد برشته', 'به میزان دلخواه', '', null, true),
    ],
    steps: [
      'آرد و نمک را در ظرف مناسبی مخلوط کنید.',
      'آب را به تدریج اضافه کنید و همزمان هم بزنید تا مایه‌ای کاملاً یکدست و رقیق، شبیه خامه رقیق به دست آید.',
      'روی ظرف را بپوشانید و مایه را حدود ۳۰ دقیقه استراحت دهید.',
      'صفحه فلزی یا تابه تخت را روی حرارت متوسط رو به زیاد قرار دهید تا کاملاً داغ شود. سطح آن را با مقدار کمی روغن حیوانی چرب کنید.',
      'یک ملاقه کوچک از مایه را روی صفحه بریزید و سریع با پشت قاشق یا دست مرطوب به شکل دایره‌ای بسیار نازک پخش کنید.',
      'اجازه دهید حدود ۱ تا ۲ دقیقه بپزد تا سطح نان خشک و زیر آن کمی طلایی شود. این نان معمولاً بدون برگرداندن پخته می‌شود.',
      'نان را از صفحه جدا کنید و در صورت تمایل کمی روغن حیوانی ذوب‌شده روی آن بمالید.',
      'نان را در حالت گرم از وسط تا کنید و سپس دوباره تا بزنید تا به شکل ربع دایره در آید.',
      'عسل را روی نان بریزید و در صورت تمایل با کنجد برشته تزئین کنید.',
      'بلافاصله و به صورت گرم سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_13@',
    id: 'rcp_chebab',
    slug: 'chebab',
    nameFa: 'چِباب کویتی',
    nameOriginal: 'Chebab',
    country: 'کویت (از نان‌های صبحانه سنتی کویت و کشورهای حوزه خلیج فارس)',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۴ نفر (حدود ۱۲ عدد)',
    shortDescription: 'پنکیک سنتی معطر با زعفران، هل و گلاب که در صبحانه همراه عسل سرو می‌شود.',
    categories: ['breakfast', 'cakes-pastries'],
    categoryIds: ['cat_breakfast', 'cat_pastries'],
    ingredients: [
      buildIng('آرد سفید گندم', '۲۵۰', 'گرم'),
      buildIng('تخم‌مرغ', '۱', 'عدد'),
      buildIng('شیر ولرم یا آب', '۴۰۰', 'میلی‌لیتر'),
      buildIng('شکر', '۵۰', 'گرم'),
      buildIng('خمیرمایه خشک', '۱', 'قاشق چای‌خوری'),
      buildIng('نمک', 'نصف', 'قاشق چای‌خوری'),
      buildIng('پودر هل', '۱', 'قاشق چای‌خوری'),
      buildIng('زردچوبه', 'نصف', 'قاشق چای‌خوری'),
      buildIng('زعفران', 'مقدار کمی', ''),
      buildIng('گلاب', '۲', 'قاشق غذاخوری'),
      buildIng('روغن یا روغن حیوانی برای پخت', 'به مقدار لازم', ''),
      buildIng('عسل برای سرو', 'به مقدار لازم', ''),
      buildIng('خامه محلی یا قیماق', 'به مقدار لازم', '', null, true, 'برای سرو'),
      buildIng('کنجد', 'به مقدار لازم', '', null, true, 'برای تزئین'),
    ],
    steps: [
      'زعفران را آسیاب کرده و با ۱ قاشق غذاخوری آب یا شیر گرم مخلوط کنید و ۱۰ دقیقه کنار بگذارید.',
      'شیر ولرم را با خمیرمایه و شکر مخلوط کنید و ۵ دقیقه منتظر بمانید تا خمیرمایه فعال شود.',
      'آرد، نمک، هل و زردچوبه را در ظرفی مخلوط کنید.',
      'مخلوط شیر و خمیرمایه را به مواد خشک اضافه کنید. تخم‌مرغ، زعفران و گلاب را نیز بیفزایید و هم بزنید تا مایه‌ای صاف و روان حاصل شود.',
      'روی ظرف را بپوشانید و ۱ ساعت در جای گرم قرار دهید تا مایه حباب‌دار شود.',
      'تابه تخت را روی حرارت متوسط گرم کنید و سطح آن را با مقدار کمی روغن چرب کنید.',
      'یک ملاقه از مایه را در مرکز تابه بریزید و سریع پخش کنید تا دایره‌ای نازک به قطر حدود ۲۰ سانتی‌متر تشکیل شود.',
      'پس از پخت، پنکیک را خارج کنید و بقیه مایه را به همین ترتیب بپزید.',
      'چِباب‌ها را گرم همراه عسل سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_14@',
    id: 'rcp_qaymaq-bal',
    slug: 'qaymaq-bal',
    nameFa: 'قایماق عسل',
    nameOriginal: 'Qaymaq & Bal',
    country: 'جمهوری آذربایجان',
    servingTypes: ['COLD', 'WARM'],
    yieldText: 'برای ۴ نفر (تقریبی)',
    shortDescription: 'صبحانه کلاسیک آذربایجانی با قایماق یا خامه غلیظ لبنی، عسل طبیعی و نان تنوری گرم.',
    categories: ['breakfast'],
    categoryIds: ['cat_breakfast'],
    ingredients: [
      buildIng('قایماق یا خامه غلیظ لبنی', '۲۵۰', 'گرم'),
      buildIng('عسل', '۱۲۰', 'گرم'),
      buildIng('نان تنوری آذربایجانی', '۴', 'عدد کوچک'),
    ],
    steps: [
      'قایماق را در ظرف سرو بریزید.',
      'عسل را به آرامی روی سطح قایماق اضافه کنید.',
      'نان تنوری را گرم کنید.',
      'هنگام صرف صبحانه، تکه‌های نان را به قایماق و عسل آغشته کنید.',
    ],
  },
  {
    photoPrefix: 'photo_15@',
    id: 'rcp_shirguruch',
    slug: 'shirguruch',
    nameFa: 'شِیرگوروچ ازبکی',
    nameOriginal: 'Shirguruch',
    country: 'ازبکستان',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۴ نفر',
    shortDescription: 'شیربرنج گرم صبحانه در آشپزی ازبکستان پخته شده با شیر پرچرب، کره و عسل طبیعی.',
    categories: ['breakfast'],
    categoryIds: ['cat_breakfast'],
    ingredients: [
      buildIng('شیر پرچرب', '۱', 'لیتر'),
      buildIng('برنج سفید', '۲۰۰', 'گرم'),
      buildIng('عسل', 'نصف قاشق غذاخوری یا به میزان ذائقه', ''),
      buildIng('کره', '۴', 'قاشق غذاخوری'),
      buildIng('نمک', 'مقدار کمی', ''),
    ],
    steps: [
      'برنج را چند مرتبه با آب سرد بشویید تا آب نسبتاً شفاف شود.',
      'شیر را در قابلمه بریزید و روی حرارت قرار دهید تا به جوش برسد.',
      'برنج شسته را به شیر اضافه کنید و هم بزنید تا دانه‌های برنج به هم نچسبند.',
      'پس از به جوش آمدن مخلوط، حرارت را کم کنید و در قابلمه را بگذارید.',
      'اجازه دهید برنج به آرامی در شیر بپزد و هر چند دقیقه یک بار هم بزنید تا ته نگیرد.',
      'حدود ۲۵ تا ۳۰ دقیقه بپزید تا برنج کاملاً نرم شود و مخلوط به حالت فرنی غلیظ برسد.',
      'قابلمه را از روی حرارت بردارید و کمی نمک اضافه کنید.',
      'عسل و کره را به غذا اضافه کنید و هم بزنید تا کره ذوب شود و عسل در تمام مخلوط پخش شود.',
      'شِیرگوروچ را گرم در ظرف‌های جداگانه سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_16@',
    id: 'rcp_petulla',
    slug: 'petulla',
    nameFa: 'پتولا',
    nameOriginal: 'Petulla',
    country: 'آلبانی',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۵ نفر',
    shortDescription: 'خمیرهای پفکی و طلایی آلبانیایی که داغ و ترد همراه عسل طبیعی برای صبحانه سرو می‌شوند.',
    categories: ['breakfast', 'cakes-pastries'],
    categoryIds: ['cat_breakfast', 'cat_pastries'],
    ingredients: [
      buildIng('آرد سفید', '۵۰۰', 'گرم'),
      buildIng('خمیرمایه خشک فوری', '۷', 'گرم'),
      buildIng('شکر', '۱', 'قاشق چای‌خوری'),
      buildIng('نمک', '۱/۵', 'قاشق چای‌خوری'),
      buildIng('آب ولرم', '۳۵۰', 'میلی‌لیتر'),
      buildIng('روغن آفتابگردان برای خمیر', '۲', 'قاشق غذاخوری'),
      buildIng('روغن سرخ‌کردنی', 'حدود ۱', 'لیتر'),
      buildIng('عسل', 'به میزان دلخواه', ''),
    ],
    steps: [
      'خمیرمایه و شکر را در آب ولرم حل کنید و ۱۰ دقیقه کنار بگذارید.',
      'آرد و نمک را مخلوط کنید.',
      'مخلوط خمیرمایه و روغن را به آرد اضافه کنید و خمیر نرم و چسبناکی بسازید.',
      'روی خمیر را بپوشانید و حدود ۱ ساعت استراحت دهید تا حجم آن افزایش پیدا کند.',
      'روغن را در قابلمه عمیق گرم کنید.',
      'با قاشق از خمیر بردارید و داخل روغن بیندازید.',
      'هر قطعه را حدود ۲ تا ۳ دقیقه از هر طرف سرخ کنید تا طلایی شود.',
      'پس از خارج کردن، روغن اضافی را بگیرید و همراه عسل سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_17@',
    id: 'rcp_chechebsa',
    slug: 'chechebsa',
    nameFa: 'چِچِبسا',
    nameOriginal: 'Chechebsa',
    country: 'اتیوپی (به‌ویژه منطقه اورومیا)',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۳ نفر',
    shortDescription: 'صبحانه سنتی اتیوپی با تکه‌های نان تافته‌شده در کره ادویه‌دار نیتِر کیبه، ادویه بربره و عسل.',
    categories: ['breakfast'],
    categoryIds: ['cat_breakfast'],
    ingredients: [
      buildIng('آرد گندم', '۲', 'پیمانه'),
      buildIng('آب', '¾', 'پیمانه'),
      buildIng('نمک', 'نصف', 'قاشق چای‌خوری'),
      buildIng('نیتر کیبه (کره ادویه‌دار اتیوپیایی)', '۴', 'قاشق غذاخوری'),
      buildIng('ادویه بربره', '۱ تا ۲', 'قاشق چای‌خوری'),
      buildIng('عسل برای سرو', 'به میزان دلخواه', ''),
      buildIng('ماست برای سرو', 'به میزان دلخواه', null, true),
    ],
    steps: [
      'آرد، آب و نمک را مخلوط کنید و خمیر نرمی بسازید.',
      'خمیر را ۱۰ دقیقه استراحت دهید.',
      'آن را به ۲ قسمت تقسیم کنید و هر قسمت را به شکل نان نازک باز کنید.',
      'نان‌ها را در تابه خشک از هر دو طرف بپزید.',
      'نان‌های گرم را به قطعات کوچک تقسیم کنید.',
      'کره ادویه‌دار را در تابه ذوب کنید و بربره را اضافه کنید.',
      'قطعات نان را به تابه اضافه کنید و هم بزنید تا کره و ادویه به خورد نان بروند.',
      'چِچِبسا را گرم همراه عسل و در صورت تمایل ماست سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_18@',
    id: 'rcp_ontbijtkoek',
    slug: 'ontbijtkoek',
    nameFa: 'نان عسلی ادویه‌ای (آنت‌بیت‌کوک)',
    nameOriginal: 'Ontbijtkoek',
    country: 'هلند',
    servingTypes: ['COLD', 'WARM'],
    yieldText: 'برای ۱۲ نفر',
    shortDescription: 'کیک صبحانه معروف هلندی با آرد چاودار، عسل طبیعی فراوان و ترکیب ۵ ادویه گرم.',
    categories: ['breakfast', 'cakes-pastries'],
    categoryIds: ['cat_breakfast', 'cat_pastries'],
    ingredients: [
      buildIng('آرد چاودار', '۲۵۰', 'گرم'),
      buildIng('آرد گندم', '۱۵۰', 'گرم'),
      buildIng('عسل', '۲۰۰', 'گرم'),
      buildIng('شکر قهوه‌ای تیره یا شیره چغندر', '۱۰۰', 'گرم'),
      buildIng('شیر', '۲۵۰', 'میلی‌لیتر'),
      buildIng('ادویه مخصوص نان', '۳', 'قاشق چای‌خوری'),
      buildIng('جوش شیرین', '۲', 'قاشق چای‌خوری'),
      buildIng('نمک', '۱', 'پنس'),
      buildIng('دارچین آسیاب‌شده', '۲', 'قاشق چای‌خوری', null, false, 'ترکیب ادویه نان'),
      buildIng('میخک آسیاب‌شده', '۱', 'قاشق چای‌خوری', null, false, 'ترکیب ادویه نان'),
      buildIng('زنجبیل آسیاب‌شده', '۱', 'قاشق چای‌خوری', null, false, 'ترکیب ادویه نان'),
      buildIng('جوز هندی', 'نصف', 'قاشق چای‌خوری', null, false, 'ترکیب ادویه نان'),
      buildIng('انیسون یا هل', 'نصف', 'قاشق چای‌خوری', null, false, 'ترکیب ادویه نان'),
    ],
    steps: [
      'شیر را همراه عسل و شکر قهوه‌ای روی حرارت ملایم گرم کنید تا مواد حل شوند. اجازه ندهید بجوشد.',
      'مخلوط را کنار بگذارید تا ولرم شود.',
      'آرد چاودار، آرد گندم، ادویه‌ها، جوش شیرین و نمک را در ظرفی مخلوط کنید.',
      'مواد مایع را به مواد خشک اضافه کرده و هم بزنید تا خمیر یکدستی حاصل شود.',
      'خمیر را در قالب مستطیلی پوشیده شده با کاغذ روغنی بریزید.',
      'در فر از پیش گرم‌شده با دمای ۱۶۰ درجه سانتی‌گراد حدود ۱ ساعت بپزید.',
      'پس از پخت، اجازه دهید کاملاً سرد شود و سپس آن را بسته‌بندی کنید. بهتر است ۱ شب استراحت کند و روز بعد به صورت ضخیم برش بخورد.',
      'همراه کره سرد یا بدون کره سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_19@',
    id: 'rcp_kitcha-with-honey',
    slug: 'kitcha-with-honey',
    nameFa: 'نان کیچا و عسل',
    nameOriginal: 'Kitcha with Honey',
    country: 'اریتره',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۴ نفر',
    shortDescription: 'نان تخت لایه‌دار اریتره‌ای برشته شده با کره ذوب‌شده، سیاه‌دانه و عسل طبیعی.',
    categories: ['breakfast', 'cakes-pastries'],
    categoryIds: ['cat_breakfast', 'cat_pastries'],
    ingredients: [
      buildIng('آرد گندم', '۳۵۰', 'گرم'),
      buildIng('نمک', '۱', 'قاشق چای‌خوری'),
      buildIng('آب ولرم', '۲۰۰', 'میلی‌لیتر'),
      buildIng('روغن گیاهی', '۲', 'قاشق غذاخوری'),
      buildIng('کره ذوب‌شده برای روی نان', '۲۵', 'گرم'),
      buildIng('عسل', '۱۲۰', 'گرم'),
      buildIng('کنجد یا سیاه‌دانه', 'به میزان لازم', '', null, true),
    ],
    steps: [
      'آرد و نمک را در ظرفی مخلوط کنید.',
      'آب ولرم و روغن را به تدریج اضافه کرده و خمیر را ۶ تا ۸ دقیقه ورز دهید.',
      'روی خمیر را بپوشانید و ۱۵ دقیقه استراحت دهید.',
      'خمیر را به ۴ قسمت مساوی تقسیم کنید.',
      'هر قسمت را به شکل ورقه‌ای نازک با قطر حدود ۲۰ تا ۲۵ سانتی‌متر باز کنید.',
      'سطح خمیر را کمی کره ذوب‌شده بمالید، آن را تا کنید و دوباره باز کنید تا لایه‌هایی ایجاد شود.',
      'نان‌ها را روی تابه سنگین یا صفحه مخصوص پخت، هر طرف ۲ تا ۴ دقیقه بپزید تا طلایی شوند.',
      'پس از خارج کردن نان از تابه، کمی کره ذوب‌شده روی آن بمالید.',
      'نان‌ها را برش دهید و همراه عسل در ظرف جداگانه سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_20@',
    id: 'rcp_greek-yogurt-honey-breakfast',
    slug: 'greek-yogurt-honey-breakfast',
    nameFa: 'صبحانه ماست یونانی و عسل',
    nameOriginal: 'Greek Yogurt and Honey Breakfast',
    country: 'یونان و قبرس',
    servingTypes: ['COLD', 'WARM'],
    yieldText: 'برای ۱ نفر',
    shortDescription: 'صبحانه سبک و سالم مدیترانه‌ای با ماست یونانی، عسل، میوه تازه فصل، نان سبوس‌دار و قهوه.',
    categories: ['breakfast'],
    categoryIds: ['cat_breakfast'],
    ingredients: [
      buildIng('نان سبوس‌دار', '۶۰', 'گرم'),
      buildIng('ماست یونانی', '۱۵۰', 'گرم'),
      buildIng('عسل', '۲۰', 'گرم'),
      buildIng('میوه تازه فصل', '۱۵۰', 'گرم'),
      buildIng('قهوه', '۱۲۵', 'میلی‌لیتر'),
    ],
    steps: [
      'ماست یونانی را در ظرف صبحانه بریزید.',
      'عسل را روی ماست اضافه کنید.',
      'میوه تازه را شسته و خرد کنید و کنار ماست قرار دهید.',
      'نان سبوس‌دار را به صورت برش‌های مناسب آماده کنید.',
      'نان، ماست عسلی و میوه را همراه قهوه سرو کنید.',
    ],
  },
  {
    photoPrefix: 'photo_21@',
    id: 'rcp_morgengrod-med-aebler',
    slug: 'morgengrod-med-aebler',
    nameFa: 'حریره جو دانمارکی (مورگن‌گرود)',
    nameOriginal: 'Morgengrod med aebler',
    country: 'دانمارک',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۴ نفر',
    shortDescription: 'حریره گرم و سنتی دانمارک با جو مرواریدی، جو دوسر، سیب ترش، کرن‌بری خشک، فندق بوداده و عسل.',
    categories: ['breakfast'],
    categoryIds: ['cat_breakfast'],
    ingredients: [
      buildIng('آب', '۱', 'لیتر'),
      buildIng('شیر', '۲۰۰', 'میلی‌لیتر'),
      buildIng('جو پوست‌کنده یا جو مرواریدی', '۲۸۰', 'گرم'),
      buildIng('جو دوسر پرک', '۷۰', 'گرم'),
      buildIng('نمک', '۱', 'قاشق چای‌خوری سرپر'),
      buildIng('سیب ترش', '۲', 'عدد'),
      buildIng('کرن‌بری خشک', '۱', 'مشت'),
      buildIng('فندق بوداده خردشده', '۱', 'مشت'),
      buildIng('عسل برای سرو', 'به میزان لازم', ''),
    ],
    steps: [
      'آب را داخل قابلمه بریزید و جو پوست‌کنده و جو دوسر را اضافه کنید.',
      'مخلوط را روی حرارت ملایم حدود ۳۰ تا ۴۵ دقیقه بپزید و مرتب هم بزنید تا دانه‌های جو نرم شوند.',
      'اگر حریره بیش از اندازه غلیظ شد کمی آب اضافه کنید.',
      'پس از نرم شدن غلات، شیر را اضافه کنید تا بافت حریره کرمی‌تر شود.',
      'نمک را اضافه کرده و مواد را مخلوط کنید.',
      'حریره را در ظرف‌های سرو بریزید.',
      'سیب خردشده، کرن‌بری خشک و فندق بوداده را روی آن قرار دهید.',
      'در پایان عسل را روی حریره بریزید.',
    ],
  },
  {
    photoPrefix: 'photo_22@',
    id: 'rcp_wattle-seed-honey-porridge',
    slug: 'wattle-seed-honey-porridge',
    nameFa: 'حریره دانه واتل و عسل کاراملی',
    nameOriginal: 'Wattle Seed and Burnt Honey Porridge',
    country: 'استرالیا',
    servingTypes: ['HOT', 'WARM'],
    yieldText: 'برای ۴ نفر',
    shortDescription: 'حریره معطر استرالیایی با دانه واتل بوداده، عسل کاراملی شده، کره و جو دوسر پرک.',
    categories: ['breakfast'],
    categoryIds: ['cat_breakfast'],
    ingredients: [
      buildIng('دانه واتل آسیاب‌شده', '۱', 'قاشق غذاخوری'),
      buildIng('کره', '۱', 'قاشق غذاخوری'),
      buildIng('عسل', '۴', 'قاشق غذاخوری'),
      buildIng('عسل اضافی برای سرو', 'به میزان دلخواه', '', null, true),
      buildIng('شیر', '۲', 'پیمانه', 'حدود ۵۰۰ میلی‌لیتر'),
      buildIng('جو دوسر پرک', '۱', 'پیمانه'),
      buildIng('نمک', '۲', 'قاشق چای‌خوری'),
    ],
    steps: [
      'دانه واتل آسیاب‌شده را در قابلمه‌ای با کف ضخیم روی حرارت متوسط کمی تفت دهید تا عطر آن آزاد شود.',
      'عسل را اضافه کنید و اجازه دهید برای چند ثانیه تیره‌تر و کاراملی شود.',
      'کره را اضافه کنید و مرتب هم بزنید.',
      'شیر و جو دوسر را داخل قابلمه بریزید.',
      'مخلوط را به نقطه جوش ملایم برسانید و سپس حرارت را کم کنید.',
      'مواد را بپزید تا جو دوسر نرم و حریره غلیظ و کرمی شود.',
      'نمک را اضافه کنید.',
      'حریره را در ظرف‌های سرو بریزید و در صورت تمایل کمی عسل روی آن اضافه کنید.',
    ],
  },
];

async function run() {
  for (const d of OUT_DIRS) {
    await fs.mkdir(d, { recursive: true });
  }

  const photoFiles = await fs.readdir(PHOTOS_DIR);
  const recipes = JSON.parse(await fs.readFile(RECIPES_JSON_PATH, 'utf8'));
  const assets = JSON.parse(await fs.readFile(ASSETS_JSON_PATH, 'utf8'));

  let nextIndex = recipes.reduce((m, r) => Math.max(m, r.index || 0), 0);
  let nextSort = recipes.reduce((m, r) => Math.max(m, r.sortOrder ?? -1), -1);
  const ts = 1794320000000;
  let addedRecipes = 0;
  let updatedRecipes = 0;

  for (let i = 0; i < NEW_RECIPES.length; i++) {
    const spec = NEW_RECIPES[i];
    const matchFile = photoFiles.find((f) => f.startsWith(spec.photoPrefix));
    if (!matchFile) {
      throw new Error(`Photo not found for ${spec.slug} (${spec.photoPrefix})`);
    }
    const srcPath = path.join(PHOTOS_DIR, matchFile);
    const filename = `breakfast-${spec.slug}-${ts + i}.webp`;

    const pipeline = sharp(srcPath).rotate().resize({
      width: 800,
      height: 800,
      fit: 'inside',
      withoutEnlargement: true,
    });
    const outBuffer = await pipeline.webp({ quality: 82, effort: 4 }).toBuffer();
    const meta = await sharp(outBuffer).metadata();
    const blurBuf = await sharp(outBuffer)
      .resize(16, 16, { fit: 'inside' })
      .webp({ quality: 35 })
      .toBuffer();
    const blurDataUrl = `data:image/webp;base64,${blurBuf.toString('base64')}`;

    for (const d of OUT_DIRS) {
      // Remove older breakfast-<slug>-*.webp variants so re-running stays clean
      const existingOut = await fs.readdir(d);
      for (const f of existingOut) {
        if (f.startsWith(`breakfast-${spec.slug}-`) && f !== filename) {
          await fs.unlink(path.join(d, f)).catch(() => {});
        }
      }
      await fs.writeFile(path.join(d, filename), outBuffer);
    }

    const publicUrl = `/uploads/recipes/${filename}`;
    const assetId = `ast_recipe_breakfast_${spec.slug}`;
    const nowIso = '2026-11-26T12:00:00.000Z';

    const assetRecord = {
      id: assetId,
      storageKey: `recipes/${filename}`,
      mime: 'image/webp',
      bytes: outBuffer.length,
      width: meta.width || 800,
      height: meta.height || 600,
      blurDataUrl,
      alt: spec.nameFa,
      createdById: 'usr_system',
      createdAt: nowIso,
      updatedAt: nowIso,
      url: publicUrl,
    };

    const existingAssetIdx = assets.findIndex((a) => a.id === assetId);
    if (existingAssetIdx >= 0) {
      assets[existingAssetIdx] = assetRecord;
    } else {
      assets.push(assetRecord);
    }

    const stepsFormatted = spec.steps.map((text, idx) => ({
      text,
      sortOrder: idx,
    }));

    const searchTokens = [
      spec.nameFa,
      spec.nameOriginal,
      spec.country,
      spec.yieldText,
      spec.shortDescription,
      'صبحانه',
      spec.categories.includes('cakes-pastries') ? 'کیک و شیرینی نان پنکیک' : '',
      ...spec.ingredients.map((ing) => `${ing.name} ${ing.note || ''}`),
    ]
      .filter(Boolean)
      .join(' ');

    const existingRecipeIdx = recipes.findIndex((r) => r.slug === spec.slug || r.id === spec.id);
    if (existingRecipeIdx >= 0) {
      const prev = recipes[existingRecipeIdx];
      recipes[existingRecipeIdx] = {
        ...prev,
        slug: spec.slug,
        nameFa: spec.nameFa,
        nameOriginal: spec.nameOriginal,
        country: spec.country,
        servingTypes: spec.servingTypes,
        yieldText: spec.yieldText,
        status: 'PUBLISHED',
        cardTheme: prev.cardTheme || 'AUTO',
        ingredients: spec.ingredients,
        steps: stepsFormatted,
        categories: spec.categories,
        categoryIds: spec.categoryIds,
        updatedAt: nowIso,
        searchText: normalizeSearchText(searchTokens),
        imageUrl: publicUrl,
        shortDescription: spec.shortDescription,
        longDescription: null,
        mainImageId: assetId,
        mainImage: publicUrl,
        image: publicUrl,
      };
      updatedRecipes++;
    } else {
      nextIndex++;
      nextSort++;
      recipes.push({
        id: spec.id,
        index: nextIndex,
        slug: spec.slug,
        nameFa: spec.nameFa,
        nameOriginal: spec.nameOriginal,
        country: spec.country,
        servingTypes: spec.servingTypes,
        yieldText: spec.yieldText,
        status: 'PUBLISHED',
        isFeatured: false,
        cardTheme: 'AUTO',
        sortOrder: nextSort,
        ingredients: spec.ingredients,
        steps: stepsFormatted,
        categories: spec.categories,
        categoryIds: spec.categoryIds,
        createdAt: nowIso,
        updatedAt: nowIso,
        searchText: normalizeSearchText(searchTokens),
        imageUrl: publicUrl,
        shortDescription: spec.shortDescription,
        longDescription: null,
        mainImageId: assetId,
        mainImage: publicUrl,
        image: publicUrl,
      });
      addedRecipes++;
    }
  }

  await fs.writeFile(ASSETS_JSON_PATH, JSON.stringify(assets, null, 2) + '\n', 'utf8');
  await fs.writeFile(RECIPES_JSON_PATH, JSON.stringify(recipes, null, 2) + '\n', 'utf8');

  console.log(
    JSON.stringify({
      ok: true,
      processed: NEW_RECIPES.length,
      addedRecipes,
      updatedRecipes,
      totalRecipes: recipes.length,
      totalAssets: assets.length,
    })
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
