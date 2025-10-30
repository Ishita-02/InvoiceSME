import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from './context/Web3Provider';
import Header from "@/components/Header";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "InvoiceSME",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>
          <Header />
          <main>{children}</main> 
        </Web3Provider>
        
      </body>
    </html>
  );
}
