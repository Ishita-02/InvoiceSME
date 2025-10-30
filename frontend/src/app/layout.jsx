"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from './context/Web3Provider';
import Header from "@/components/Header";
import { usePathname } from "next/navigation"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const pathname = usePathname(); 
  const showHeader = pathname !== '/';
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>
          {showHeader && <Header />} 
          {children}
        </Web3Provider>
        
      </body>
    </html>
  );
}
