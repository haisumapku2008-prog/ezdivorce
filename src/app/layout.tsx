import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CaseProvider } from "@/lib/store/case-store";
import { SiteHeader, SiteFooter } from "@/components/site-header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Divorce Filing Assistant",
  description: "TurboTax-style DIY divorce filing — Washington State MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen antialiased`}>
        <CaseProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </CaseProvider>
      </body>
    </html>
  );
}
