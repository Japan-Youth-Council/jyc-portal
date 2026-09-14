'use client';

import { ReactNode } from 'react';

export default function KnowledgeLayout({
  sidebarOpen,
  onCloseSidebar,
  sidebar,
  children,
}: {
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-[calc(100dvh-64px)] md:h-[calc(100vh-61px)] bg-gray-50 text-gray-800 relative overflow-hidden">
      {sidebarOpen && (
        <div
          className="md:hidden absolute inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={onCloseSidebar}
        />
      )}
      <aside
        className={`absolute md:relative inset-y-0 left-0 z-50 w-72 bg-white border-r flex flex-col transition-transform duration-300 ease-in-out shadow-xl md:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {sidebar}
      </aside>
      <main className="flex-1 flex flex-col bg-gray-50 relative overflow-hidden w-full min-w-0">
        {children}
      </main>
    </div>
  );
}
