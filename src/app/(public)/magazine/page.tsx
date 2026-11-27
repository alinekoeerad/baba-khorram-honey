import type { Metadata } from 'next';
import { MagazineListingClient } from '@/components/public/magazine-listing-client';
import { getPublicMagazineArticles } from '@/server/services/magazine-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'مجله علمی عسل و زنبورداری | عسل باباخُرم',
  description:
    'مقالات علمی و تخصصی درباره رویال ژل، گرده گل، بره‌موم، نان زنبور (پرگا)، فرآیند رس بستن یا شکرک زدن عسل، عسل سفید و طبع‌شناسی عسل‌ها.',
  alternates: {
    canonical: '/magazine',
  },
};

export default async function MagazinePage() {
  const articles = await getPublicMagazineArticles();
  return <MagazineListingClient initialArticles={articles} />;
}
