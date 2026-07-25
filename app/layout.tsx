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
  metadataBase: new URL(
    "https://stillgood-computer-check.divadeluxxe.chatgpt.site",
  ),
  title: {
    default: "StillGood",
    template: "%s · StillGood",
  },
  description:
    "StillGood automatically tests practical browser usability and explains what an older computer remains good for.",
  openGraph: {
    title: "StillGood",
    description:
      "One automatic test that explains what a computer is still good for.",
    images: [{ url: "/og.png", width: 1536, height: 1024 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StillGood",
    description:
      "One automatic test that explains what a computer is still good for.",
    images: ["/og.png"],
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
