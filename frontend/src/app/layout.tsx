import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "./providers";
import { appFontVariableClassName } from "@/lib/app-fonts";
import { GlobalErrorSentinel } from "@/components/common/GlobalErrorSentinel";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  /** 使 env(safe-area-inset-*) 在刘海屏 / Home Indicator 设备上可用 */
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0d9488" },
    { media: "(prefers-color-scheme: dark)", color: "#115e59" },
  ],
};

export const metadata: Metadata = {
  title: "Magnifier New Core",
  description: "Big Bang rewrite UI shell",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className={appFontVariableClassName} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <GlobalErrorSentinel>
          <AppProviders>{children}</AppProviders>
        </GlobalErrorSentinel>
      </body>
    </html>
  );
}
