import type { Metadata } from 'next'; 

import { QueryProvider } from '@/lib/query-provider';
import { Toaster } from '@/components/ui/toaster';
import { Exo_2, Inter, Noto_Sans_Arabic } from 'next/font/google';
import { I18nProvider } from '@/lib/i18n';
import '../styles/globals.css';

import { Providers } from '@/components/providers';
import { BackgroundDesign } from '@/components/layout/background-design';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const exo2 = Exo_2({ subsets: ['latin'], variable: '--font-heading', weight: ['400', '500', '600', '700', '800'] });
const notoArabic = Noto_Sans_Arabic({ subsets: ['arabic'], variable: '--font-arabic', weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'The Communium — Réseau VIP Maroc-Monde',
  description:
    'Plateforme de networking premium pour professionnels et entreprises au Maroc et à l\'international.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

      <html lang="fr" suppressHydrationWarning>
        <body className={`${inter.variable} ${exo2.variable} ${notoArabic.variable} min-h-screen bg-background text-foreground antialiased font-sans`}>
          <Providers>
            <BackgroundDesign />
            {children}
            <Toaster />
          </Providers>
        </body>
      </html>
  );
}
