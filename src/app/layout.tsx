import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "طبيبي AI | موظف استقبال الواتساب الذكي للعيادات",
  description: "نظام أتمتة الواتساب واستقبال المواعيد الذكي للعيادات والمراكز الطبية في مصر",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-[#0b132b] text-slate-100 selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
