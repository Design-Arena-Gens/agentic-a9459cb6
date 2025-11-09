import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mainz Café Contacts",
  description:
    "Directory of 50 cafés in Mainz, Germany with verified contact emails and source links.",
  openGraph: {
    title: "Mainz Café Contacts",
    description:
      "Explore 50 cafés in Mainz, Germany with verified email addresses, websites, and source references.",
    url: "https://agentic-a9459cb6.vercel.app",
    siteName: "Mainz Café Contacts",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mainz Café Contacts",
    description:
      "Verified directory of cafés in Mainz with names, emails, and helpful references.",
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
        {children}
      </body>
    </html>
  );
}
