# وب‌سایت رسمی شورای ملی عسل (Persian National Honey Board)

بازآفرینی کامل، وفادار به طراحی و استاندارد صنعتی صفحه اصلی وب‌سایت مرجع [honey.com](https://honey.com/) با جهت‌بندی راست‌به‌چپ (RTL)، تایپوگرافی اصیل فارسی و معماری ماژولار آماده اتصال به پنل مدیریت (Admin Panel / CMS).

## معماری پروژه (Architecture)

```
.
├── index.html                 # نقطه ورود و ساختار سمانتیک SSR
├── package.json               # پیکربندی ماژول‌های ES
├── sitemap.xml                # نقشه سایت استاندارد سئو
├── robots.txt                 # دستورالعمل خزنده‌های موتور جستجو
├── assets/
│   ├── css/
│   │   ├── typography.css     # استانداردهای تایپوگرافی وزیرمتن
│   │   └── style.css          # سیستم استایل، رنگ‌ها، پالت honey.com و قوانین RTL
│   └── images/                # پیوند نمادین به پوشه تصاویر
├── images/                    # محل استقرار فایل‌های تصویر اصلی
│   ├── beekeeping.jpg
│   ├── bees-banner.jpg
│   ├── blog-honey.jpg
│   ├── figure-image-right@2x.png
│   ├── header-bg.jpg
│   ├── hero-1.jpg
│   ├── homepage-footer-logo@2x.png
│   ├── honey-jar.jpg
│   ├── recipe-1.jpg تا recipe-6.jpg
│   └── wood-bg.jpg
└── src/
    ├── types/
    │   └── index.ts           # تعاریف مدل‌های داده و اینترفیس‌های تایپ‌اسکریپت (CMS Entities)
    ├── content/
    │   ├── site-content.json  # پایگاه داده ساختاریافته محتوای صفحه اصلی
    │   └── initial-data.js    # منبع داده اولیه سازگار با مرورگر
    ├── repositories/
    │   ├── IHomepageRepository.ts
    │   └── HomepageRepository.js # لایه مخزن داده (Repository Pattern)
    ├── services/
    │   ├── IHomepageService.ts
    │   └── HomepageService.js    # لایه منطق دامنه و اعتبارسنجی/امنیت محتوا
    ├── components/
    │   ├── UIHelpers.js          # آیکون‌ها و توابع رندرینگ مشترک (دکمه‌های قرصی، فلش نقطه‌چین)
    │   ├── UtilityBar.js         # نوار بالایی و منوی دراپ‌داون صنعت و همکاران
    │   ├── Header.js             # هدر چسبان، لوگو، پیوندها و کشوی جستجو
    │   ├── HeroSection.js        # بخش قهرمان هدر با بهینه‌سازی LCP
    │   ├── BeekeepingSection.js  # بخش تجلیل از زنبورداری (ویژگی ۱)
    │   ├── BannerSection.js      # بنر تبلیغاتی کار زنبورها (ویژگی ۲)
    │   ├── VersatilitySection.js # بخش کاربردهای همه‌جانبه عسل (ویژگی ۳)
    │   ├── RecipeSection.js      # اسلایدر ۶ کارت دستور پخت‌های منتخب
    │   ├── BlogSection.js        # بخش وبلاگ / ماه ملی عسل با پس‌زمینه چوبی
    │   ├── Footer.js             # فوتر چندسطحی استاندارد
    │   └── CookieBanner.js       # بنر رضایت کوکی و ذخیره‌سازی در LocalStorage
    └── app.js                    # کنترل‌کننده برنامه و راه‌انداز رویدادها
```

## راهنمای اتصال پنل مدیریت آینده (Future Admin / CMS Readiness)

این پروژه از الگوی تفکیک محتوا از نمایش (Separation of Content and Presentation) بهره می‌برد:
1. کامپوننت‌های رابط کاربری (`src/components/`) هیچ متن کاری هاردکد شده‌ای در خود ندارند و همگی داده‌های تایپ‌شده دریافت می‌کنند.
2. مخزن داده (`src/repositories/HomepageRepository.js`) نقطه اتصال بین داده و فرانت‌اند است. برای اتصال به پنل مدیریت آینده یا دیتابیس، کافی است متد `getHomepageData()` در این فایل به اندپوینت API یا GraphQL متصل شود.
3. اینترفیس‌های موجود در `src/types/index.ts` دقیقاً معادل جداول/موجودیت‌های پایگاه داده آینده شامل `SiteSettings`، `HeroSection`، `Recipe`، `BlogPost`، `NavigationItem` و `SEOSettings` می‌باشند.
