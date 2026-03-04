import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoShift - シフト自動作成",
  description: "飲食店向けシフト自動作成アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const now = new Date();

  return (
    <html lang="ja">
      <body className={`${geistSans.variable} antialiased bg-gray-50 min-h-screen`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link
              href={`/shifts/${now.getFullYear()}/${now.getMonth() + 1}`}
              className="font-bold text-lg text-gray-900 hover:text-blue-600 transition-colors"
            >
              AutoShift
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href={`/shifts/${now.getFullYear()}/${now.getMonth() + 1}`}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                シフト管理
              </Link>
              <Link
                href={`/staffing/${now.getFullYear()}/${now.getMonth() + 1}`}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                出勤人数設定
              </Link>
              <Link
                href="/members"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                メンバー管理
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
