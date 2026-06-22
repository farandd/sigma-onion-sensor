import React from 'react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-surface">
      <Sidebar />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4 pt-16 lg:p-6 pb-24 lg:pb-6 overflow-auto bg-neutral-surface">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
