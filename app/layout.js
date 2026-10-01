import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'ShopSmart',
  description: 'A product search & recommendation engine built from scratch: inverted index, TF-IDF, BM25, spelling correction and collaborative filtering.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-paper font-sans text-ink antialiased">
        <Header />
        <main className="mx-auto max-w-7xl px-5 sm:px-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
