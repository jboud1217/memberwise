import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemberWise",
  description: "AI-native membership management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
