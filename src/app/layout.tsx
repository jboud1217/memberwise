import type { Metadata } from "next";
import {
  Inter,
  Playfair_Display,
  Source_Sans_3,
  Poppins,
  Cormorant_Garamond,
  Nunito_Sans,
  Nunito,
  Space_Grotesk,
  DM_Sans,
  Lora,
  Open_Sans,
  Oswald,
  Roboto,
  Plus_Jakarta_Sans,
  Quicksand,
} from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display" });
const sourceSans3 = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans-3" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });
const cormorantGaramond = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-cormorant-garamond" });
const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito-sans" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto" });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta-sans" });
const quicksand = Quicksand({ subsets: ["latin"], variable: "--font-quicksand" });

const fontVariables = [
  inter, playfairDisplay, sourceSans3, poppins, cormorantGaramond,
  nunitoSans, nunito, spaceGrotesk, dmSans, lora, openSans,
  oswald, roboto, plusJakartaSans, quicksand,
].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  title: {
    default: "MemberWise",
    template: "%s — MemberWise",
  },
  description: "AI-native membership management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={fontVariables}>{children}</body>
    </html>
  );
}
