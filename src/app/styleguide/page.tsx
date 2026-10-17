/**
 * Styleguide Page (Phase 5, Task 4)
 * Protected administrative / development showcase of all design tokens, shared components,
 * and component states.
 */

import { Metadata } from 'next';
import { requireAdmin } from '@/server/auth/require-admin';
import { PillButton } from '@/components/ui/pill-button';
import { ContentCard } from '@/components/ui/content-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { WoodBackground } from '@/components/ui/wood-background';
import { WoodGroup } from '@/components/ui/wood-group';
import { Container } from '@/components/ui/container';
import { ChannelIcon } from '@/components/public/channel-icon';
import { CHANNEL_TYPES_META, buildChannelUrl } from '@/lib/contact-channels';

export const metadata: Metadata = {
  title: 'راهنمای سبک و کامپوننت‌ها (Styleguide) | ادمین',
  robots: { index: false, follow: false },
};

export default async function StyleguidePage() {
  // Task 4 constraint: Protected for admin-only access
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#FDFBF8] text-[#2B2017] py-12 space-y-16">
      <Container>
        <div className="border-b border-[#EFE9E0] pb-6 mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#2B2017]">راهنمای جامع دیزاین سیستم و کامپوننت‌ها</h1>
            <p className="text-sm text-[#5C5248] mt-1">
              صفحه موقت نمایش تمام وضعیت‌ها، تم‌ها و رفتارهای بصری (دسترسی فقط ادمین)
            </p>
          </div>
          <PillButton variant="gold" size="sm" href="/admin">
            بازگشت به پنل مدیریت
          </PillButton>
        </div>

        {/* 1. Pill Button Showcase */}
        <section className="space-y-6 bg-white p-8 rounded-2xl border border-[#EFE9E0] shadow-xs">
          <SectionHeading
            align="right"
            title="۱. دکمه‌های بیضی (PillButton)"
            subtitle="طراحی فیکس‌شده با سه نقطه در انتها • فاقد هرگونه علامت فلش یا فلش‌های یونیکد"
          />

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-[#5C5248]">انواع رنگی (Variants):</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <PillButton variant="gold">واریانت طلایی (Gold)</PillButton>
              <PillButton variant="green">واریانت سبز (Green)</PillButton>
              <PillButton variant="orange">واریانت نارنجی (Orange)</PillButton>
            </div>

            <h3 className="text-sm font-bold text-[#5C5248] pt-4">اندازه‌ها (Sizes):</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <PillButton variant="gold" size="sm">اندازه کوچک (sm)</PillButton>
              <PillButton variant="gold" size="md">اندازه متوسط (md)</PillButton>
              <PillButton variant="gold" size="lg">اندازه بزرگ (lg)</PillButton>
            </div>

            <h3 className="text-sm font-bold text-[#5C5248] pt-4">وضعیت‌ها و رندر به عنوان پیوند (Link & Disabled):</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <PillButton variant="green" href="/products">
                رندر به عنوان لینک داخلی Next.js
              </PillButton>
              <PillButton variant="gold" disabled>
                دکمه غیرفعال (Disabled)
              </PillButton>
            </div>
          </div>
        </section>

        {/* 2. ContentCard Themes Showcase */}
        <section className="space-y-6 bg-white p-8 rounded-2xl border border-[#EFE9E0] shadow-xs mt-12">
          <SectionHeading
            align="right"
            title="۲. کارت‌های محتوا (ContentCard)"
            subtitle="گوشه‌های تیز ۹۰ درجه • افکت بالارفتن ۶ پیکسل و بزرگنمایی تصویر ۱.۰۸ در هاور • تم‌های چهارگانه قفل‌شده"
          />

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#5C5248]">تم‌های قفل‌شده (Locked Themes):</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <ContentCard
                title="عسل گون کوهستان"
                subtitle="نام علمی: Astragalus"
                href="#demo"
                theme="green"
                linkLabel="مشاهده محصول"
              />
              <ContentCard
                title="عسل آویشن وحشی"
                subtitle="نام علمی: Thymus vulgaris"
                href="#demo"
                theme="orange"
                linkLabel="مشاهده محصول"
              />
              <ContentCard
                title="عسل بهارنارنج"
                subtitle="متن تیره روی پس‌زمینه زرد"
                href="#demo"
                theme="yellow"
                linkLabel="مشاهده محصول"
              />
              <ContentCard
                title="عسل زرشک و عناب"
                subtitle="طبع معتدل و تصفیه کبد"
                href="#demo"
                theme="burgundy"
                linkLabel="مشاهده محصول"
              />
            </div>

            <h3 className="text-sm font-bold text-[#5C5248] pt-8">
              کارت ناموجود (Out of Stock Badge) و حالت خودکار (AUTO):
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <ContentCard
                title="عسل اقاقیا (تمام شده)"
                subtitle="برداشت مجدد بهار آینده"
                href="#demo"
                theme="AUTO"
                slug="acacia-honey"
                isAvailable={false}
                linkLabel="مشاهده جزئیات"
              />
              <ContentCard
                title="شربت سکنجبین و عسل"
                subtitle="خاستگاه: ایران باستان"
                href="#demo"
                theme="AUTO"
                slug="sekanjabin-recipe"
                isAvailable={true}
                linkLabel="مشاهده طرز تهیه"
              />
            </div>

            <h3 className="text-sm font-bold text-[#5C5248] pt-8">
              کارت افقی ردیف موبایل (Horizontal Mobile Row Variant):
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ContentCard
                variant="horizontal"
                title="عسل کوهی سبلان"
                subtitle="برداشت اردبیل و مشگین‌شهر"
                href="#demo"
                theme="green"
                isAvailable={true}
                linkLabel="سفارش"
              />
              <ContentCard
                variant="horizontal"
                title="معجون شیر و بادام و عسل"
                subtitle="انرژی‌بخش و مقوی سیستم ایمنی"
                href="#demo"
                theme="orange"
                isAvailable={true}
                linkLabel="دستور مصرف"
              />
            </div>
          </div>
        </section>

        {/* 3. Contact Channels URL Patterns Table */}
        <section className="space-y-6 bg-white p-8 rounded-2xl border border-[#EFE9E0] shadow-xs mt-12">
          <SectionHeading
            align="right"
            title="۳. جدول الگوهای URL و اعتبارسنجی کانال‌های ارتباطی"
            subtitle="الگوهای تولید شده در سمت سرور طبق استانداردهای رسمی پلتفرم‌ها"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#EFE9E0] text-xs font-bold text-[#5C5248] bg-[#FDFBF8]">
                  <th className="py-3 px-4">پلتفرم</th>
                  <th className="py-3 px-4">نمونه مقدار</th>
                  <th className="py-3 px-4">الگوی URL نهایی سمت سرور</th>
                  <th className="py-3 px-4">دریافت سفارش؟</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9E0]">
                {Object.values(CHANNEL_TYPES_META).map((m) => {
                  const url = buildChannelUrl(m.type, m.example);
                  return (
                    <tr key={m.type}>
                      <td className="py-3 px-4 font-bold text-[#2B2017] flex items-center gap-2">
                        <ChannelIcon type={m.type} className="w-4 h-4 text-amber-600" />
                        <span>{m.titleFa}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#5C5248]" dir="ltr">
                        {m.example}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-amber-700" dir="ltr">
                        {url}
                      </td>
                      <td className="py-3 px-4">
                        {m.allowedOrderChannel ? (
                          <span className="text-emerald-700 font-bold text-xs">مجاز</span>
                        ) : (
                          <span className="text-rose-600 font-bold text-xs">غیرمجاز (قانون سند)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </Container>

      {/* 4. Wood Background & Wood Group Demo */}
      <div className="mt-16 space-y-8">
        <Container>
          <SectionHeading
            align="right"
            title="۴. پس‌زمینه بافت چوب (WoodBackground & WoodGroup)"
            subtitle="لایه محافظت تیره rgba(35,20,10,0.45) با کنتراست استاندارد و متن سفید"
          />
        </Container>

        <WoodBackground className="py-16">
          <Container className="text-center space-y-4">
            <h3 className="text-2xl font-black text-[#2B2017]">تک‌سکشن بافت چوب (WoodBackground)</h3>
            <p className="text-sm text-[#5C5248] max-w-lg mx-auto font-medium">
              این بخش به صورت مستقل بافت چوب طبیعی روشن را ایجاد می‌کند.
            </p>
            <div className="pt-2">
              <PillButton variant="gold" size="sm">
                آزمون دکمه روی چوب
              </PillButton>
            </div>
          </Container>
        </WoodBackground>

        <WoodGroup className="py-12">
          <div className="py-8">
            <Container className="text-center">
              <h4 className="text-xl font-black text-[#2B2017]">بخش اول گروه چوبی (WoodGroup Item 1)</h4>
              <p className="text-xs text-[#5C5248] mt-2 font-medium">اتصال پیوسته بدون درز میان دو بخش متوالی</p>
            </Container>
          </div>
          <div className="py-8">
            <Container className="text-center">
              <h4 className="text-xl font-black text-[#2B2017]">بخش دوم گروه چوبی (WoodGroup Item 2)</h4>
              <p className="text-xs text-[#5C5248] mt-2 font-medium">عدم هم‌پوشانی مضاعف یا تغییر کنتراست پس‌زمینه</p>
            </Container>
          </div>
        </WoodGroup>
      </div>
    </div>
  );
}
