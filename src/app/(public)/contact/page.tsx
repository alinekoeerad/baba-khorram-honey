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
import { SettingsService, DEFAULT_SETTINGS } from '@/server/services/settings-service';
import { buildChannelUrl } from '@/lib/contact-channels';
import { ContactView } from '@/components/public/contact-view';
import { serializeJsonLd } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://babakhorram.com';
  const canonicalUrl = `${siteUrl}/contact`;

  let siteNameFa = 'عسل باباخُرم';
  try {
    const settings = await getPublicSiteSettings();
    if (settings?.siteNameFa) {
      siteNameFa = settings.siteNameFa;
    }
  } catch {
    // Non-blocking fallback
  }

  const title = `تماس با ما | ${siteNameFa}`;
  const description = `راه‌های ارتباطی، نشانی دفتر مرکزی، ساعت کاری و نقشه موقعیت مکانی ${siteNameFa}`;

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
      siteName: siteNameFa,
    },
  };
}

export default async function ContactPage() {
  let settings: any = DEFAULT_SETTINGS;
  try {
    const fetchedSettings = await getPublicSiteSettings();
    if (fetchedSettings) {
      settings = fetchedSettings;
    }
  } catch {
    settings = DEFAULT_SETTINGS;
  }

  let channels: any[] = [];
  try {
    const rawChannels = await SettingsService.getChannels({ onlyActive: true });
    channels = (rawChannels || []).map((ch) => ({
      ...ch,
      url: buildChannelUrl(ch.type, ch.value),
    }));
  } catch {
    channels = [];
  }

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
    name: settings.siteNameFa || 'عسل باباخُرم',
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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ContactView
        siteNameFa={settings.siteNameFa || 'عسل باباخُرم'}
        address={address}
        workingHours={workingHours}
        latitude={latitude}
        longitude={longitude}
        zoom={zoom}
        channels={channels}
      />
    </>
  );
}
