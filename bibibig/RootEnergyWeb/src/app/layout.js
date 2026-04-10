import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '@/styles/globals.css';

export const metadata = {
  title: '루트에너지',
  description: '지역과 함께하는 재생에너지 전문기업',
  keywords: '루트에너지, 재생에너지, RE100, 탄소중립, 태양광, 풍력, 지역상생',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <Header />
        <main className="min-h-screen pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

