import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaxCreditScout — Find every tax credit your CPA missed",
  description:
    "Answer 5 questions. Our AI scans 47 federal, 200+ state, and 100+ local tax credits to find every one your business qualifies for. Average finding: $14,200.",
  openGraph: {
    title: "TaxCreditScout",
    description: "Find every tax credit your CPA missed.",
    url: "https://taxcreditscout.com",
    siteName: "TaxCreditScout",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
