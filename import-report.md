# گزارش واردسازی داده‌ها (Import Report)

> تولید خودکار توسط `pnpm import:data` مطابق با بخش ۱۶ مستند پروژه (Brief Section 16).
> تمامی متون نمایشی مشتری به صورت کلمه‌به‌کلمه (Verbatim) حفظ شده و هیچ‌گونه تصحیح املایی یا نرمال‌سازی روی متون اصلی انجام نگرفته است.

---

## ۱. خلاصه آمار و وضعیت

| بخش | تعداد | وضعیت ذخیره‌سازی | گزینه‌های سفارش (Options) |
|---|---|---|---|
| **محصولات (Products)** | 31 | PUBLISHED | صفر (توسط ادمین بعداً افزوده می‌شود) |
| **دستورهای نوشیدنی (Recipes)** | 37 | PUBLISHED | - |
| **تداخل در شناسه‌ها (Slug Collisions)** | 0 | کاملاً یکتا | - |
| **اقلام با ساختار خاص/ابهام پایین** | 3 | ثبت و تحلیل‌شده | - |

---

## ۲. بررسی عدم تداخل شناسه‌های لاتین (Slugs)

- تمام ۳۱ محصول دارای شناسه‌های لاتین یکتا بر مبنای `nameOriginal` می‌باشند.
- تمام ۳۷ دستور نوشیدنی دارای شناسه‌های لاتین یکتا بر مبنای `nameOriginal` می‌باشند.
- تعداد تداخل‌ها: **۰**

---

## ۳. موارد با دقت پایین یا ساختار خاص در خطوط مواد لازم (Low-Confidence Lines)

تعداد 3 خط به دلیل داشتن پرانتزهای تو در تو، دونقطه چندگانه، یا عبارات توضیحی استخراج شدند و تمامی توکن‌ها به صورت کامل نگهداری شدند:

1. **دستور 6 (کارکاده)**: `یخ: برای نوع سرد: به مقدار لازم`
   - نام: «یخ» | مقدار: «برای نوع سرد: به مقدار لازم» | واحد: «-» | معادل: «-» | اختیاری: خیر | توضیحات: «-»

2. **دستور 37 (چای زنجبیل)**: `عسل: ۳۰ تا ۴۰ گرم (حدود ۲ قاشق غذا خوری`
   - نام: «عسل» | مقدار: «۳۰ تا ۴۰» | واحد: «گرم» | معادل: «حدود ۲ قاشق غذا خوری» | اختیاری: خیر | توضیحات: «-»

3. **دستور 37 (چای زنجبیل)**: `خلال یا برش زنجبیل (اختیاری برای تزئین)`
   - نام: «خلال یا برش زنجبیل (اختیاری برای تزئین)» | مقدار: «-» | واحد: «-» | معادل: «-» | اختیاری: خیر | توضیحات: «-»

---

## ۴. جدول کامل تخصیص دسته‌بندی دستورهای نوشیدنی (جهت تأیید سرپرست)

منطبق با ۴ قانون صریح بخش ۱۶ مستند:
1. شیر به عنوان مایع اصلی -> `milk-drinks` (نوشیدنی‌های شیری)
2. آرد/پودر غلات یا دانه‌ها به عنوان پایه -> `grain-seed-drinks` (نوشیدنی‌های غلات و دانه‌ها)
3. میوه، مرکبات، پوره یا سرکه به عنوان ویژگی اصلی -> `sharbat-fruit-drinks` (شربت‌ها و نوشیدنی‌های میوه‌ای)
4. برگ‌ها، گیاهان، گل‌ها یا ادویه‌جات دم‌شده در آب -> `teas-infusions` (چای و دمنوش‌ها)

| ردیف | نام فارسی دستور | نام اصلی (لاتین) | نوع سرو | دسته‌بندی‌های تخصیص‌یافته |
|---|---|---|---|---|
| 1 | آمالاکی پاناکا | Amalaki Panaka | COLD | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 2 | چای پوملو | Fengmi Youzi Cha | COLD | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 3 | شوگایو | Hachimitsu Shogayu | HOT | نوشیدنی‌های غلات و دانه‌ها (`grain-seed-drinks`) • شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 4 | موت هوی‌آن | Nuoc Mot | COLD | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 5 | لیموناد خانگی یونانی | Greek Homemade Lemonad with Honey | COLD | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 6 | کارکاده | Karkadeh | HOT, COLD | چای و دمنوش‌ها (`teas-infusions`) |
| 7 | سحلب | Sahlab | HOT | نوشیدنی‌های شیری (`milk-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 8 | چای نومی بصره | Chai Noomi Basra | HOT | چای و دمنوش‌ها (`teas-infusions`) |
| 9 | قهوا پشاوری | Peshawari Kahwa | HOT | چای و دمنوش‌ها (`teas-infusions`) |
| 10 | قهوا افغانی | Afghan Kahwah | HOT | چای و دمنوش‌ها (`teas-infusions`) |
| 11 | چای تاشکند | Tashkent Tea | HOT | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 12 | ایسکَنجه‌بی | Iskencebi | COLD | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 13 | عطر عسل | Honey Aroma | HOT, COLD | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 14 | قهوه حَضرمی | Qahwa Hadramiya | HOT | چای و دمنوش‌ها (`teas-infusions`) |
| 15 | بسیسه | Bsissa | COLD, WARM | نوشیدنی‌های غلات و دانه‌ها (`grain-seed-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 16 | حَلیب الدجاج (شیر مرغ) | Lait de poule | COLD | نوشیدنی‌های شیری (`milk-drinks`) |
| 17 | چای نعناع الجزایری | The a la menthe algerien | HOT | چای و دمنوش‌ها (`teas-infusions`) |
| 18 | بویه | Jus de Bouye | COLD | نوشیدنی‌های شیری (`milk-drinks`) • شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) |
| 19 | زوم کوم | Zoom-Koom | COLD | نوشیدنی‌های غلات و دانه‌ها (`grain-seed-drinks`) • شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 20 | آگواس فرسکاس | Agua Fresca de citricoc | COLD | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) |
| 21 | شربت ریحان | Balli Reyhan Serbeti | COLD | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 22 | چای کوهستانی یونانی | Greek Mountain Tea with Honey & Lemon | HOT | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 23 | شیر و عسل | Latte e Miele | HOT | نوشیدنی‌های شیری (`milk-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 24 | چای نعناع مراکشی | Atay B Naanaa | HOT | چای و دمنوش‌ها (`teas-infusions`) |
| 25 | لیموناد ایتالیایی | Limonata con Miele | COLD | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 26 | شربت سرکه انگبین (سکنجبین) | Sekanjabin Sharbat | COLD | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 27 | چای گل داوودی | Fengmi juhua cha | COLD | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 28 | تامبه جوس | Tombe Juice | COLD | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 29 | نوشیدنی زنجبیلی گینه | Ginger Drink | COLD | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 30 | کورما چای | Kuurma Chai | HOT | نوشیدنی‌های غلات و دانه‌ها (`grain-seed-drinks`) • نوشیدنی‌های شیری (`milk-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 31 | شیرین عسل | Sladkiy Myod | HOT | چای و دمنوش‌ها (`teas-infusions`) |
| 32 | چای سبز ازبکی | Ko`k Choy | HOT | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 33 | سَتو | Sattu Drink | COLD | نوشیدنی‌های غلات و دانه‌ها (`grain-seed-drinks`) • شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 34 | متّه سوری | المتّه بالعسل و اللیمون و الزنجبیل | HOT | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 35 | چای نعناع لبنانی | Shai bil Nana | HOT | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 36 | چای علف لیمو | Cha Takrai | COLD | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |
| 37 | چای زنجبیل | Saenggang Cha | HOT | شربت‌ها و نوشیدنی‌های میوه‌ای (`sharbat-fruit-drinks`) • چای و دمنوش‌ها (`teas-infusions`) |

---

## ۵. نتیجه آزمون بازگشت‌پذیری مواد لازم (Verbatim Round-Trip)

- آزمون بازسازی واژگان روی تمامی ۲۲۱ خط مواد لازم در ۳۷ دستور اجرا شد.
- نتیجه: **۲۲۱ از ۲۲۱ خط (۱۰۰٪)** به صورت کامل و بدون از دست رفتن هیچ واژه‌ای بازسازی شدند.
