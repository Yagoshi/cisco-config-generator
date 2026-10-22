import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cisco Config Studio | パラメーターシート連携コンフィグ生成",
  description:
    "Ciscoのパラメーターシート(Excel)から設定コマンド・チェックシート・ネットワーク構成図を生成するツール",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-app-bg text-app-text">
        {children}
      </body>
    </html>
  );
}
