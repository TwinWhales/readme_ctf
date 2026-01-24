import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/theme-provider"
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CTF Writeups",
  description: "A platform for sharing and organizing CTF writeups.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-background text-foreground transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <div className="flex min-h-[calc(100vh-4rem)]">
            <Sidebar />
            <div className="flex-1 w-full">
              <main className="container mx-auto max-w-7xl px-4 py-8">
                {children}
              </main>
            </div>
          </div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
