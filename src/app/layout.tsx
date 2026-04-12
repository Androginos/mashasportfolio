import type { Metadata, Viewport } from "next";
import {
  Caveat,
  Fredoka,
  Itim,
  Luckiest_Guy,
  Quicksand,
} from "next/font/google";
import "./globals.css";

const luckiestGuy = Luckiest_Guy({
  weight: "400",
  variable: "--font-luckiest-guy",
  subsets: ["latin"],
});

const itim = Itim({
  weight: ["400"],
  variable: "--font-itim",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "Minik Sanatci Portfoy",
  description: "9 yasindaki bir kiz cocugu icin cizim sergisi portfoyu",
};

/** Mobil tarayıcılarda (özellikle Android) ölçek ve güvenli alan tutarlılığı için */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${luckiestGuy.variable} ${itim.variable} ${fredoka.variable} ${quicksand.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="flex min-h-full min-h-[100dvh] flex-col">{children}</body>
    </html>
  );
}
