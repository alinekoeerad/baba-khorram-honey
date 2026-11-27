export interface NavSubLink {
  label: string;
  href: string;
  badge?: string;
}

export const MONOFLORAL_HONEY_LINKS: NavSubLink[] = [
  { label: 'گَوَن کتیرا (گَوَن زرد)', href: '/products/astragalus-yellow' },
  { label: 'گَوَن گزانگبین', href: '/products/astragalus' },
  { label: 'کُنار (سدر)', href: '/products/ziziphus' },
  { label: 'قنقال', href: '/products/echinops' },
  { label: 'مریم گلی', href: '/products/officinalis' },
  { label: 'آویشن', href: '/products/thymus' },
  { label: 'بوقناق (زول)', href: '/products/eryngium' },
  { label: 'بهار نارنج', href: '/products/citrus-bigaradia' },
  { label: 'بادام', href: '/products/almond' },
  { label: 'یونجه', href: '/products/alfalfa' },
  { label: 'گشنیز', href: '/products/coriandrum' },
  { label: 'شوید', href: '/products/dill' },
  { label: 'جعفری', href: '/products/parsley' },
  { label: 'سماق', href: '/products/sumac' },
  { label: 'سیاهدانه', href: '/products/nigella-sativa' },
  { label: 'اکالیپتوس (کینا)', href: '/products/eucalyptus' },
  { label: 'اقاقیا', href: '/products/acacia' },
  { label: 'رازیانه (بادیان)', href: '/products/foeniculum' },
  { label: 'کنجد', href: '/products/sesame' },
  { label: 'زنجیرخار (خارکیوار)', href: '/products/cirsium' },
  { label: 'پنج انگشت (فلفل بیابانی)', href: '/products/five-finger' },
  { label: 'پنبه', href: '/products/cotton' },
  { label: 'زنیان (انیسون بری)', href: '/products/ajwain' },
  { label: 'زرشک', href: '/products/berberis' },
  { label: 'زعفران', href: '/products/saffron' },
  { label: 'شاه بلوط', href: '/products/chestnut' },
  { label: 'گاوپونه (گل اروانه)', href: '/products/oregano-cow' },
];

export interface ProductDropdownItem extends NavSubLink {
  id: string;
  hasMonofloralSubmenu?: boolean;
}

export const PRODUCT_DROPDOWN_ITEMS: ProductDropdownItem[] = [
  {
    id: 'monofloral',
    label: 'عسل تک‌گیاه',
    href: '/products?category=honey-types',
    hasMonofloralSubmenu: true,
  },
  {
    id: 'multi-plants',
    label: 'عسل چند گیاه',
    href: '/products/multi-plants',
  },
  {
    id: 'royal-jelly',
    label: 'رویال ژل',
    href: '/products/royal-jelly',
  },
  {
    id: 'pollen',
    label: 'گرده گل',
    href: '/products/pollen',
  },
  {
    id: 'propolis',
    label: 'بره‌موم',
    href: '/magazine/propolis',
    badge: 'دانشنامه علمی',
  },
];

export const MAGAZINE_DROPDOWN_ITEMS: NavSubLink[] = [
  { label: 'همه چیز درباره رویال ژل', href: '/magazine/royal-jelly' },
  { label: 'همه چیز درباره گرده گل', href: '/magazine/bee-pollen' },
  { label: 'همه چیز درباره بره‌موم', href: '/magazine/propolis' },
  { label: 'فرآیند رس بستن یا شکرک زدن عسل', href: '/magazine/crystallization' },
  { label: 'عسل سفید چیست؟', href: '/magazine/creamed-honey' },
  { label: 'نان زنبور چیست؟', href: '/magazine/bee-bread' },
  { label: 'طبع‌شناسی عسل‌ها (۲۹ عسل)', href: '/magazine/honey-temperament' },
];

export const FAQ_DROPDOWN_ITEMS: NavSubLink[] = [
  { label: 'معیار تشخیص عسل اصل از عسل تقلبی', href: '/faq#authenticity' },
  { label: 'آیا تمام عسل‌ها طبع گرم دارند؟', href: '/faq#temperament' },
  { label: 'علت رقیق یا آبکی بودن عسل چیست؟', href: '/faq#watery' },
  { label: 'چرا طعم عسلِ یک گیاه در خریدهای مختلف متفاوت است؟', href: '/faq#taste-variation' },
];
