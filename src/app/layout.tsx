import { Oswald, Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { MantineProvider } from '@mantine/core';
import AuthWrapper from '@/components/AuthWrapper';
import ReduxProvider from '@/store/Provider';
import '@mantine/core/styles.css';
import './globals.css';

const oswald = Oswald({ subsets: ['latin'], weight: ['700'], variable: '--font-oswald' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'ATAMSA Traveler Registry',
  description: 'Registry system for ATAMSA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${oswald.variable} ${inter.variable}`}>
      <body className="font-sans bg-gray-50">
        <MantineProvider>
          <Toaster position="top-center" />
          <ReduxProvider>
            <AuthWrapper>{children}</AuthWrapper>
          </ReduxProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
