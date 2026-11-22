import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";
import { IconSprite } from "@/components/Icons";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Varnika",
  description: "Varnika Boutique by Sujatha Panjam. Blouses, sarees and custom stitching, made by hand in Hyderabad.",
  manifest: "/manifest.json",
  icons: { icon: "/icon-192.png?v=2", apple: "/apple-touch-icon.png?v=2" },
  appleWebApp: { capable: true, title: "Varnika", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#F1F0EA",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gilda+Display&family=Poppins:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <IconSprite />
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
