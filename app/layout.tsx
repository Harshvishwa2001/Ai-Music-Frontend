import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Session — song generator",
  description: "Write lyrics. Get a full song back.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen antialiased">{children}</body>
    </html>
  );
}
