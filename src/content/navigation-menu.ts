export interface NavSubLink {
  label: string;
  href: string;
  badge?: string;
}

export const MONOFLORAL_HONEY_LINKS: NavSubLink[] = [
  { label: 'گَوَن کتیرا', href: '/products/astragalus-yellow' },
  { label: 'گَوَن گزانگبین', href: '/products/astragalus' },
  { label: 'کُنار', href: '/products/ziziphus' },
  { label: 'قنقال', href: '/products/echinops' },
  { label: 'مریم‌گلی', href: '/products/officinalis' },
  { label: 'آویشن', href: '/products/thymus' },
  { label: 'بوقناق', href: '/products/eryngium' },
  { label: 'بهارنارنج', href: '/products/citrus-bigaradia' },
  { label: 'بادام', href: '/products/almond' },
  { label: 'یونجه', href: '/products/alfalfa' },
  { label: 'گشنیز', href: '/products/coriandrum' },
  { label: 'شوید', href: '/products/dill' },
  { label: 'جعفری', href: '/products/parsley' },
  { label: 'سماق', href: '/products/sumac' },
  { label: 'سیاه‌دانه', href: '/products/nigella-sativa' },
  { label: 'اکالیپتوس', href: '/products/eucalyptus' },
  { label: 'اقاقیا', href: '/products/acacia' },
  { label: 'رازیانه', href: '/products/foeniculum' },
  { label: 'کنجد', href: '/products/sesame' },
  { label: 'زنجیرخار', href: '/products/cirsium' },
  { label: 'پنج‌انگشت', href: '/products/five-finger' },
  { label: 'پنبه', href: '/products/cotton' },
  { label: 'زنیان', href: '/products/ajwain' },
  { label: 'زرشک', href: '/products/berberis' },
  { label: 'زعفران', href: '/products/saffron' },
  { label: 'شاه‌بلوط', href: '/products/chestnut' },
  { label: 'گاوپونه', href: '/products/oregano-cow' },
];

export interface ProductDropdownItem extends NavSubLink {
  id: string;
  hasMonofloralSubmenu?: boolean;
}

export const PRODUCT_DROPDOWN_ITEMS: ProductDropdownItem[] = [
  {
    id: 'monofloral',
    label: 'عسل‌های تک‌گیاه',
    href: '/products?category=honey-types',
    hasMonofloralSubmenu: true,
  },
  {
    id: 'multi-plants',
    label: 'عسل چندگیاه',
    href: '/products/multi-plants',
  },
  {
    id: 'royal-jelly',
    label: 'ژل رویال اصل',
    href: '/products/royal-jelly',
  },
  {
    id: 'pollen',
    label: 'گرده گل طبیعی',
    href: '/products/pollen',
  },
  {
    id: 'propolis',
    label: 'آشنایی با بره‌موم',
    href: '/magazine/propolis',
    badge: 'مقاله',
  },
];

export const MAGAZINE_DROPDOWN_ITEMS: NavSubLink[] = [
  { label: 'خواص و راهنمای مصرف ژل رویال', href: '/magazine/royal-jelly' },
  { label: 'خواص درمانی و ارزش غذایی گرده گل', href: '/magazine/bee-pollen' },
  { label: 'بره‌موم و کاربردهای آن در سلامت', href: '/magazine/propolis' },
  { label: 'علت و فرآیند رس‌بستن (شکرک زدن) عسل', href: '/magazine/crystallization' },
  { label: 'آشنایی با عسل سفید', href: '/magazine/creamed-honey' },
  { label: 'نان زنبور عسل؛ خواص و ویژگی‌ها', href: '/magazine/bee-bread' },
  { label: 'راهنمای طبع‌شناسی انواع عسل', href: '/magazine/honey-temperament' },
];

export const FAQ_DROPDOWN_ITEMS: NavSubLink[] = [
  { label: 'چگونه عسل طبیعی را از تقلبی تشخیص دهیم؟', href: '/faq#authenticity' },
  { label: 'آیا همه عسل‌ها طبع گرم دارند؟', href: '/faq#temperament' },
  { label: 'چرا غلظت برخی عسل‌ها با هم متفاوت است؟', href: '/faq#watery' },
  { label: 'چرا طعم و رنگ یک نوع عسل در فصل‌های مختلف فرق می‌کند؟', href: '/faq#taste-variation' },
];
