import "./globals.css";

import { Analytics } from "@vercel/analytics/react";

// import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "DiagramGPT",
  description:
    "Draw flowchart, sequence diagram, class diagram, user journey, gantt, C4C diagram with nature language.",
};

// const fontSans = FontSans({
//   subsets: ["latin"],
//   variable: "--font-sans",
//   display: "swap",
// });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-white font-sans text-slate-900 antialiased flex flex-col"
          // fontSans.variable
        )}
      >
        <SiteHeader />
        {children}

        <Analytics />
      </body>
    </html>
  );
}
