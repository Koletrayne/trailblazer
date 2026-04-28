import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import ThemeBoot from "@/components/ThemeBoot";

export const metadata: Metadata = {
  title: "Trail Blazer — National Parks Tracker",
  description: "Track visited parks, plan trips, gear up, and stargaze at U.S. National Parks.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trail Blazer",
    startupImage: ["/icons/icon-512.png"]
  },
  icons: {
    icon: [
      { url: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icons/icon-152.png", sizes: "152x152" },
      { url: "/icons/icon-192.png", sizes: "192x192" }
    ],
    shortcut: "/icons/icon-96.png"
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#2f5b35",
    "msapplication-TileImage": "/icons/icon-144.png"
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2f5b35" },
    { media: "(prefers-color-scheme: dark)", color: "#162a1a" }
  ],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeBoot />
        <NavBar />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
      </body>
    </html>
  );
}
