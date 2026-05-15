import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "CITO — Pré-diagnóstico SXF",
  description: "Sistema de pré-diagnóstico da Síndrome do X Frágil",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('cito-theme')||'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
