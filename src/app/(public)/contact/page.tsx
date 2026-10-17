/**
 * Contact Page (Phase 10 Tasks 3-5)
 * URL: /contact
 *
 * Requirements:
 * - Address, working hours, active contact channels.
 * - Leaflet OSM map with self-hosted assets, lazy-loading, and fallback card.
 * - Route buttons below the map.
 * - Metadata and JSON-LD (LocalBusiness).
 * - No contact form, no messaging.
 */

import React from 'react';
import type { Metadata } from 'next';
import { getPublicSiteSettings } from '@/server/queries/settings';
import { SettingsService } from '@/server/services/settings-service';
import { buildChannelUrl } from '@/lib/contact-channels';
import { ContactView } from '@/components/public/contact-view';
import { env } from '@/lib/env';

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://babakhorram.com';
  const canonicalUrl = `${siteUrl}/contact`;

  const title = `تماس با ما | ${settings.siteNameFa}`;
  const description = `راه‌های ارتباطی، نشانی دفتر مرکزی، ساعت کاری و نقشه موقعیت مکانی ${settings.siteNameFa}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      locale: 'fa_IR',
      siteName: settings.siteNameFa,
    },
  };
}

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();
  const rawChannels = await SettingsService.getChannels({ onlyActive: true });

  const channels = rawChannels.map((ch) => ({
    ...ch,
    url: buildChannelUrl(ch.type, ch.value),
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://babakhorram.com';

  const address =
    settings.address ||
    'کرج، جهانشهر، بلوار مولانا';
  const workingHours =
    settings.workingHours ||
    'همه‌روزه از ساعت ۹:۰۰ الی ۲۱:۰۰';
  const latitude = settings.latitude ?? 35.8339878;
  const longitude = settings.longitude ?? 50.9915841;
  const zoom = settings.mapZoom ?? 15;

  const phoneChannel = channels.find((c) => c.type === 'PHONE');

  // JSON-LD schema.org/LocalBusiness per Task 5
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: settings.siteNameFa,
    description: settings.tagline || settings.seoDescription || undefined,
    url: siteUrl,
    telephone: phoneChannel?.value || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressCountry: 'IR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude,
      longitude,
    },
    openingHours: workingHours,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactView
        siteNameFa={settings.siteNameFa}
        address={address}
        workingHours={workingHours}
        latitude={latitude}
        longitude={longitude}
        zoom={zoom}
        channels={channels}
        tileUrl={env.OSM_TILE_URL}
      />
    </>
  );
}
