import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/auth-context'
import { TranslationProvider } from '@/contexts/translation-context'
import { NavBar } from '@/components/nav-bar'

const inter = Inter({ subsets: ["latin"] });
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  variable: '--font-noto-sans-kr'
});

export const metadata: Metadata = {
  title: "English to Korean Script Translator",
  description: "Advanced translation application for long English scripts to Korean",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${notoSansKr.variable}`}>
        <AuthProvider>
          <TranslationProvider>
            <NavBar />
            {children}
          </TranslationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
