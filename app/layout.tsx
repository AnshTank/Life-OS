import "./globals.css";
import { ClientLayout } from "@/components/ClientLayout";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Life OS",
  description: "Personal Life Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Indie+Flower&family=Kalam:wght@300;400;700&family=Patrick+Hand&family=Architects+Daughter&display=swap" rel="stylesheet" />
      </head>

      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
