import type { Metadata, Viewport } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'Training System V1 — 健身训练规划工具',
  description: '基于健身教练理论的智能训练规划系统',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Training V1',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 py-4 pb-20 md:pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}
