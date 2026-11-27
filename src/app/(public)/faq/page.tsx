import type { Metadata } from 'next';
import { FaqDirectoryClient } from '@/components/public/faq-directory-client';
import { getPublicFaqItems } from '@/server/services/faq-service';
import { serializeJsonLd } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'سوالات متداول | عسل طبیعی باباخُرم',
  description:
    'پاسخ علمی به سوالات متداول درباره معیار تشخیص عسل اصل از تقلبی، طبع عسل‌ها، علت رقیق بودن عسل، تفاوت طعم در برداشت‌های مختلف و روش نگهداری.',
  alternates: {
    canonical: '/faq',
  },
};

export default async function FaqPage() {
  const faqEntries = await getPublicFaqItems();

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.shortAnswer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
      />
      <FaqDirectoryClient initialEntries={faqEntries as any} />
    </>
  );
}
