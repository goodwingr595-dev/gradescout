import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GradeScout — free photo-based card pre-grader",
  description:
    "Upload a couple of photos of your trading card and get a free, rough PSA-style grade range estimate. Not affiliated with PSA, CGC, or BGS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
