import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AgriTwin | Agrivoltaic Digital Twin",
    template: "%s | AgriTwin",
  },
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