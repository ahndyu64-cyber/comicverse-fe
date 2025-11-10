import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer.tsx";
import { AuthProvider } from "./contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ComicVerse - Đọc truyện tranh online",
  description: "Nền tảng đọc truyện tranh online miễn phí với nhiều thể loại đa dạng",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
         <AuthProvider>
        <Navbar />
        <main className="site-container mt-6">
          {children}
        </main>
        <Footer />
         </AuthProvider>
      </body>
    </html>
  );
}