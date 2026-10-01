import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Manrope } from "next/font/google";
import RegisterSW from "@/components/pwa/RegisterSW";
import "./globals.css";

const chakra = Chakra_Petch({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-chakra" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "RevTrack",
  description: "Maintenance tracking for your cars and bikes.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "RevTrack", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets the dock sit under the home indicator via safe-area insets
  themeColor: "#07070c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${chakra.variable} ${manrope.variable}`}>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
