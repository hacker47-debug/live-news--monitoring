import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Streamwall | Live Monitor",
  description: "Watch four live streams in one view.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
