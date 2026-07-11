import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgriTwin | Agrivoltaic Digital Twin",
  description:
    "A web-based digital twin for agrivoltaic design, simulation, monitoring and adaptive control.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}