import '@/styles/globals.css';

export const metadata = {
  title: '루트에너지 관리자',
  description: '루트에너지 관리자 페이지',
};

export default function AdminLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}

