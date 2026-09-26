/**
 * Initial Static Data Source for Persian Honey Board Homepage
 * Conforms to HomepageData schema defined in src/types/index.ts
 *
 * This content is prepared to be backed by a database / CMS API in future phases.
 */

export const initialHomepageData = {
  "seo": {
    "metaTitle": "شورای ملی عسل | مرجع رسمی، خواص شگفت‌انگیز و دستور پخت‌های اصیل با عسل طبیعی",
    "metaDescription": "پایگاه جامع شورای ملی عسل: کاوش در دنیای شگفت‌انگیز زنبورها، حمایت از زنبورداران بومی، شناخت انواع عسل طبیعی و مجموعه‌ای از دستور پخت‌های لذیذ و سالم با شهد اصیل طبیعت.",
    "canonicalUrl": "https://honey.ir/",
    "ogTitle": "شورای ملی عسل | شاهکار بی‌نظیر طبیعت",
    "ogDescription": "تغذیه اصیل، طعمی تکرارنشدنی و سرشار از انرژی طلایی برای زندگی روزمره. کشف ارزش‌های اکولوژیک زنبورداری و آشپزی با عسل طبیعی.",
    "ogImage": "images/hero-1.jpg",
    "ogType": "website",
    "twitterCard": "summary_large_image",
    "keywords": [
      "عسل طبیعی",
      "شورای ملی عسل",
      "زنبورداری پایدار",
      "دستور پخت با عسل",
      "خواص دارویی عسل",
      "گرده گل",
      "موم عسل",
      "ژل رویال"
    ],
    "locale": "fa_IR",
    "siteName": "شورای ملی عسل"
  },
  "settings": {
    "siteNameFa": "شورای ملی عسل®",
    "siteNameEn": "National Honey Board",
    "tagline": "تغذیه اصیل و انرژی طلایی طبیعت",
    "copyrightText": "© ۲۰۲۶ شورای ملی عسل (National Honey Board). تمامی حقوق مادی و معنوی محفوظ است.",
    "language": "fa",
    "direction": "rtl",
    "contactEmail": "info@honey.ir"
  },
  "utilityNav": {
    "buttonLabel": "صنعت و همکاران تجاری",
    "items": [
      {
        "id": "util-1",
        "label": "مصرف‌کنندگان (Consumers)",
        "href": "consumers.html",
        "order": 1
      },
      {
        "id": "util-2",
        "label": "خدمات غذایی و رستوران‌ها (Foodservice)",
        "href": "foodservice.html",
        "order": 2
      },
      {
        "id": "util-3",
        "label": "فرآوری‌کنندگان مواد غذایی (Food Processors)",
        "href": "food-processors.html",
        "order": 3
      },
      {
        "id": "util-4",
        "label": "خرده‌فروشی و فروشگاهی (Retail)",
        "href": "retail.html",
        "order": 4
      },
      {
        "id": "util-5",
        "label": "صنعت و تولید عسل (Industry)",
        "href": "industry.html",
        "order": 5
      },
      {
        "id": "util-6",
        "label": "متخصصان و مشاوران تغذیه (Nutrition)",
        "href": "nutrition.html",
        "order": 6
      }
    ]
  },
  "navigation": [
    {
      "id": "nav-home",
      "label": "صفحه اصلی",
      "href": "index.html",
      "isActive": true,
      "order": 1
    },
    {
      "id": "nav-about",
      "label": "درباره عسل",
      "href": "about-honey.html",
      "isActive": false,
      "order": 2
    },
    {
      "id": "nav-sustainability",
      "label": "زنبورها و پایداری",
      "href": "bees-sustainability.html",
      "isActive": false,
      "order": 3
    },
    {
      "id": "nav-recipes",
      "label": "دستور پخت‌ها",
      "href": "recipes.html",
      "isActive": false,
      "order": 4
    },
    {
      "id": "nav-locator",
      "label": "مکان‌یاب فروشگاه",
      "href": "locator.html",
      "isActive": false,
      "order": 5
    }
  ],
  "hero": {
    "id": "hero-section-1",
    "title": "شاهکار بی‌نظیر<br>طبیعت",
    "subtitle": "تغذیه اصیل، طعمی تکرارنشدنی و سرشار از انرژی طلایی برای زندگی روزمره",
    "images": [
      "images/hero-1.jpg"
    ],
    "isActive": true
  },
  "beekeeping": {
    "id": "section-beekeeping",
    "badge": "صنعت زنبورداری",
    "title": "تجلیل از<br>صنعت زنبورداری",
    "body": "شورای ملی عسل متعهد به اشتراک‌گذاری داستان‌های الهام‌بخش زنبورداران و تولیدکنندگان عسل از سراسر جهان است؛ با تأکید ویژه بر تأثیر شگرف و مثبتی که صنعت زنبورداری بر توسعه جوامع محلی، سلامت محیط‌زیست و تضمین امنیت چرخه غذایی ما بر جای می‌گذارد.",
    "image": "images/beekeeping.jpg",
    "imageAlt": "زنبوردار حرفه‌ای در حال سرکشی به کندوهای عسل در مزرعه آفتابی",
    "ctaButton": {
      "label": "کسب اطلاعات بیشتر",
      "href": "bees-sustainability.html",
      "variant": "mantis",
      "ariaLabel": "کسب اطلاعات بیشتر درباره زنبورداری و پایداری محیط زیست"
    }
  },
  "banner": {
    "id": "section-bees-banner",
    "subtitle": "با افتخار",
    "title": "کارِ زنبورها",
    "backgroundImage": "images/bees-banner.jpg",
    "ctaButton": {
      "label": "مشاهده زنبورها",
      "href": "bees-sustainability.html",
      "variant": "tan-hide",
      "ariaLabel": "مشاهده بخش زنبورها و خدمات زیست‌محیطی گرده‌افشان‌ها"
    }
  },
  "versatility": {
    "id": "section-versatility",
    "kicker": "تنها ماده‌ای که از عهده",
    "title": "هر کاری برمی‌آید",
    "body": "عسل یک دستورالعمل تک‌مؤلفه‌ای و شگفت‌انگیز است که مستقیماً توسط زنبورها، شکوفه‌های گل و خودِ مادر طبیعت خلق شده است؛ بدون افزودنی، بدون دخالت مصنوعی و سرشار از آنتی‌اکسیدان‌ها و مواد معدنی حیاتی.",
    "primaryImage": "images/honey-jar.jpg",
    "primaryImageAlt": "شیشه عسل طبیعی کهربایی شفاف با قاشق چوبی مخصوص عسل",
    "decorativeImage": "images/figure-image-right@2x.png",
    "ctaButton": {
      "label": "شناخت بیشتر عسل",
      "href": "about-honey.html",
      "variant": "sunglow",
      "ariaLabel": "شناخت ویژگی‌ها و انواع گوناگون عسل طبیعی"
    }
  },
  "recipes": {
    "id": "section-recipes",
    "title": "دستور پخت‌های منتخب",
    "recipes": [
      {
        "id": "rec-1",
        "title": "اسموتی خنک بلوبری، مرکبات و عسل",
        "slug": "blueberry-citrus-honey-smoothie",
        "image": "images/recipe-1.jpg",
        "imageAlt": "اسموتی بلوبری، لیمو و عسل طبیعی در لیوان شیشه‌ای",
        "colorScheme": "card-mantis1",
        "actionLabel": "مشاهده دستور پخت",
        "href": "recipe-detail.html?id=1",
        "order": 1,
        "featured": true
      },
      {
        "id": "rec-2",
        "title": "گرانیتای هندوانه و عسل با موم طبیعی",
        "slug": "watermelon-honey-granita",
        "image": "images/recipe-2.jpg",
        "imageAlt": "دسر یخی گرانیتای هندوانه و عسل طبیعی خنک",
        "colorScheme": "card-zest",
        "actionLabel": "مشاهده دستور پخت",
        "href": "recipe-detail.html?id=2",
        "order": 2,
        "featured": true
      },
      {
        "id": "rec-3",
        "title": "پای ماست بستنی میوه‌ای با شهد عسل",
        "slug": "frozen-yogurt-honey-berry-pie",
        "image": "images/recipe-4.jpg",
        "imageAlt": "برشی از پای ماست بستنی تزیین‌شده با تمشک و شهد عسل",
        "colorScheme": "card-hippie-pink",
        "actionLabel": "مشاهده دستور پخت",
        "href": "recipe-detail.html?id=4",
        "order": 3,
        "featured": true
      },
      {
        "id": "rec-4",
        "title": "کیک خانگی لایه‌ای با شهد عسل کوهی",
        "slug": "mountain-honey-layer-cake",
        "image": "images/recipe-5.jpg",
        "imageAlt": "کیک اسفنجی چند لایه لطیف آغشته به شربت عسل کوهستان",
        "colorScheme": "card-mantis",
        "actionLabel": "مشاهده دستور پخت",
        "href": "recipe-detail.html?id=5",
        "order": 4,
        "featured": false
      },
      {
        "id": "rec-5",
        "title": "نوشیدنی آرامش‌بخش عسل، لیمو و زنجبیل",
        "slug": "soothing-honey-lemon-ginger-tea",
        "image": "images/recipe-6.jpg",
        "imageAlt": "فنجان دمنوش داغ عسل، برش‌های لیمو و ریشه زنجبیل تازه",
        "colorScheme": "card-tan-hide",
        "actionLabel": "مشاهده دستور پخت",
        "href": "recipe-detail.html?id=6",
        "order": 5,
        "featured": false
      },
      {
        "id": "rec-6",
        "title": "بستنی عسلی نمکی با کباب میوه‌های گریل‌شده",
        "slug": "salted-honey-ice-cream-grilled-fruit",
        "image": "images/recipe-3.jpg",
        "imageAlt": "بستنی خامه‌ای با شهد عسل نمکی و میوه‌های تابستانی",
        "colorScheme": "card-sunglow",
        "actionLabel": "مشاهده دستور پخت",
        "href": "recipe-detail.html?id=3",
        "order": 6,
        "featured": true
      }
    ],
    "allRecipesCta": {
      "label": "مشاهده تمام دستور پخت‌ها",
      "href": "recipes.html",
      "variant": "hippie-pink",
      "ariaLabel": "مشاهده آرشیو کامل دستور پخت‌های غذایی با عسل"
    }
  },
  "blog": {
    "id": "section-blog",
    "tag": "وبلاگ (THE BLOG)",
    "title": "ماه ملی<br>عسل",
    "excerpt": "چه می‌شد اگر شیرین‌کننده دلخواه شما، چیزی فراتر از صرفاً یک ماده شیرین بود؟ عسل با خود شیرینی اصیل، طعمی متمایز و بافتی بی‌همتا را به قلب آشپزخانه شما می‌آورد؛ و این فقط آغاز یک سفر خوش‌طعم است. در این ماه ملی عسل، تمامی دلایل فوق‌العاده برای حضور عسل در پخت‌وپز روزمره را با هم جشن می‌گیریم.",
    "image": "images/blog-honey.jpg",
    "imageAlt": "ظروف شیشه‌ای زیبا، موم زنبور و عسل طلایی در سینی چوبی سنتی",
    "ctaButton": {
      "label": "ادامه مطلب",
      "href": "blog-honey-month.html",
      "variant": "wild-willow",
      "ariaLabel": "مطالعه مقاله کامل جشن ماه ملی عسل در وبلاگ"
    }
  },
  "footer": {
    "brandLogo": "images/homepage-footer-logo@2x.png",
    "brandTitle": "شورای ملی عسل",
    "primaryNav": [
      {
        "id": "f-nav-1",
        "label": "صفحه اصلی",
        "href": "index.html",
        "order": 1
      },
      {
        "id": "f-nav-2",
        "label": "درباره عسل",
        "href": "about-honey.html",
        "order": 2
      },
      {
        "id": "f-nav-3",
        "label": "زنبورها و پایداری",
        "href": "bees-sustainability.html",
        "order": 3
      },
      {
        "id": "f-nav-4",
        "label": "دستور پخت‌ها",
        "href": "recipes.html",
        "order": 4
      },
      {
        "id": "f-nav-5",
        "label": "فروشگاه‌یاب",
        "href": "locator.html",
        "order": 5
      }
    ],
    "linkGroups": [
      {
        "id": "fg-industry",
        "groupTitle": "صنعت و همکاران",
        "links": [
          {
            "id": "fl-ind-1",
            "label": "مصرف‌کنندگان",
            "href": "consumers.html",
            "order": 1
          },
          {
            "id": "fl-ind-2",
            "label": "خدمات غذایی",
            "href": "foodservice.html",
            "order": 2
          },
          {
            "id": "fl-ind-3",
            "label": "فرآوری مواد غذایی",
            "href": "food-processors.html",
            "order": 3
          },
          {
            "id": "fl-ind-4",
            "label": "خرده‌فروشی",
            "href": "retail.html",
            "order": 4
          },
          {
            "id": "fl-ind-5",
            "label": "صنعت عسل",
            "href": "industry.html",
            "order": 5
          },
          {
            "id": "fl-ind-6",
            "label": "مشاوران تغذیه",
            "href": "nutrition.html",
            "order": 6
          }
        ]
      },
      {
        "id": "fg-board",
        "groupTitle": "درباره شورا",
        "links": [
          {
            "id": "fl-nhb-1",
            "label": "درباره NHB",
            "href": "about-nhb.html",
            "order": 1
          },
          {
            "id": "fl-nhb-2",
            "label": "وبلاگ",
            "href": "blog.html",
            "order": 2
          },
          {
            "id": "fl-nhb-3",
            "label": "پرسش‌های متداول",
            "href": "faq.html",
            "order": 3
          },
          {
            "id": "fl-nhb-4",
            "label": "اتاق خبر",
            "href": "newsroom.html",
            "order": 4
          },
          {
            "id": "fl-nhb-5",
            "label": "تماس با ما",
            "href": "contact.html",
            "order": 5
          },
          {
            "id": "fl-nhb-6",
            "label": "خبرنامه ایمیلی",
            "href": "newsletter.html",
            "order": 6
          },
          {
            "id": "fl-nhb-7",
            "label": "فروشگاه",
            "href": "store.html",
            "order": 7
          }
        ]
      }
    ],
    "socialLinks": [
      {
        "platform": "facebook",
        "label": "فیس‌بوک",
        "href": "https://facebook.com",
        "iconClass": "fa-brands fa-facebook-f"
      },
      {
        "platform": "instagram",
        "label": "اینستاگرام",
        "href": "https://instagram.com",
        "iconClass": "fa-brands fa-instagram"
      },
      {
        "platform": "pinterest",
        "label": "پینترست",
        "href": "https://pinterest.com",
        "iconClass": "fa-brands fa-pinterest-p"
      },
      {
        "platform": "twitter",
        "label": "ایکس (توییتر سابق)",
        "href": "https://x.com",
        "iconClass": "fa-brands fa-x-twitter"
      },
      {
        "platform": "youtube",
        "label": "یوتیوب",
        "href": "https://youtube.com",
        "iconClass": "fa-brands fa-youtube"
      }
    ],
    "copyright": "© ۲۰۲۶ شورای ملی عسل (National Honey Board). تمامی حقوق مادی و معنوی محفوظ است."
  },
  "cookieBanner": {
    "title": "حریم خصوصی و کوکی‌ها",
    "message": "ما برای مدیریت، بهبود تجربه کاربری و حفظ امنیت وب‌سایت از کوکی‌ها استفاده می‌کنیم. این کوکی‌ها تنظیمات دلخواه شما را به خاطر سپرده و تجربه وب‌گردی بهتری به ارمغان می‌آورند.",
    "acceptLabel": "موافقم",
    "declineLabel": "عدم موافقت",
    "policyHref": "privacy.html"
  }
};

export default initialHomepageData;
