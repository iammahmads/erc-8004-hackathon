import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Macro-Sentry Agent - AI Trading Dashboard",
  description: "Verifiable AI-powered trading agent with on-chain transparency",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-slate-950 text-slate-100 flex">
        <Sidebar />
        <main className="flex-1 pt-16 md:pt-0 px-4 md:px-8 py-6">{children}</main>
      </body>
    </html>
  );
}
