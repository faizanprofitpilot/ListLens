import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ListLens - AI Real Estate Photo Studio",
  description: "Transform your real estate photos with AI. Upload any property photo and get stunning, professional listing images with HDR lighting, sky replacement, and style filters. 20 free edits included.",
  keywords: "real estate photography, AI photo editing, property photos, listing photos, HDR enhancement, sky replacement",
  authors: [{ name: "ListLens" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/Favicon.png", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: "/Favicon.png",
  },
  openGraph: {
    title: "ListLens - AI Real Estate Photo Studio",
    description: "Transform your real estate photos with AI. Get professional results in seconds.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ListLens - AI Real Estate Photo Studio",
    description: "Transform your real estate photos with AI. Get professional results in seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
