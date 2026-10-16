/**
 * ShellLayout Client Coordinator (Phase 5 & 10)
 * Coordinates the public shell: sticky Header with integrated corner contact tab,
 * SearchDrawer, HamburgerDrawer, and honey.com Footer.
 */

'use client';

import React, { useState, useRef } from 'react';
import { SiteSettingsData } from '@/server/services/settings-service';
import { PublicChannelItem } from '@/server/queries/settings';
import { CategoryNavItem, HamburgerDrawer } from './hamburger-drawer';
import { Header } from './header';
import { SearchDrawer } from './search-drawer';
import { Footer } from './footer';

interface ShellLayoutProps {
  settings: SiteSettingsData;
  contactBarChannels: PublicChannelItem[];
  footerChannels: PublicChannelItem[];
  productCategories: CategoryNavItem[];
  recipeCategories: CategoryNavItem[];
  children: React.ReactNode;
}

export function ShellLayout({
  settings,
  contactBarChannels,
  footerChannels,
  productCategories,
  recipeCategories,
  children,
}: ShellLayoutProps) {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF8] text-[#2B2017]">
      {/* Sticky Header with integrated honey.com corner Contact Tab & Logo */}
      <Header
        siteNameFa={settings.siteNameFa}
        cartEnabled={settings.cartEnabled}
        logo={settings.logo}
        channels={contactBarChannels}
        onOpenSearch={() => setIsSearchOpen((prev) => !prev)}
        onOpenHamburger={() => setIsHamburgerOpen(true)}
        hamburgerButtonRef={hamburgerButtonRef}
      />

      {/* Search Drawer */}
      <SearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Hamburger Drawer (Main Navigation Menu) */}
      <HamburgerDrawer
        isOpen={isHamburgerOpen}
        onClose={() => setIsHamburgerOpen(false)}
        onOpenSearch={() => {
          setIsHamburgerOpen(false);
          setIsSearchOpen(true);
        }}
        productCategories={productCategories}
        recipeCategories={recipeCategories}
        triggerRef={hamburgerButtonRef}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">{children}</main>

      {/* Authentic honey.com Footer */}
      <Footer settings={settings} channels={footerChannels} />
    </div>
  );
}
