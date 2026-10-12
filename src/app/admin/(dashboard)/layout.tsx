import React from 'react';
import { requireAdmin } from '@/server/auth/require-admin';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';
import { ToastProvider } from '@/components/admin/toast-provider';
import { CommandPalette } from '@/components/admin/command-palette';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce server-side authentication for all routes inside (dashboard)
  const { user } = await requireAdmin({ allowRedirect: true });

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-[#FDFBF8]">
        {/* Desktop Sidebar (Fixed on visual right in RTL) */}
        <div className="hidden md:flex md:w-64 md:flex-col md:shrink-0">
          <AdminSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
          <AdminHeader
            user={{
              name: user.name,
              email: user.email,
              role: user.role,
            }}
          />
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
        <CommandPalette />
      </div>
    </ToastProvider>
  );
}
