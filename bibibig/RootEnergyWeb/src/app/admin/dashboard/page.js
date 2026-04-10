'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (!isLoggedIn) {
      router.push('/admin/login');
    }
  }, [router]);

  const stats = [
    { title: '오늘 방문자', value: '1,234', change: '+12%', color: 'bg-blue-500' },
    { title: '전체 게시글', value: '456', change: '+5', color: 'bg-green-500' },
    { title: '미처리 문의', value: '23', change: '-3', color: 'bg-yellow-500' },
    { title: '활성 팝업', value: '3', change: '0', color: 'bg-purple-500' },
  ];

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">대시보드</h1>
          <p className="text-gray-600">루트에너지 관리자 페이지에 오신 것을 환영합니다.</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 text-sm">{stat.title}</h3>
                <div className={`w-10 h-10 ${stat.color} rounded-full`}></div>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stat.value}</p>
                <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 최근 게시글 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">최근 게시글</h2>
            <div className="space-y-3">
              {[
                { title: '2024년 신규 프로젝트 모집', category: '공지사항', date: '2024.01.15' },
                { title: '루트에너지 OO지역 태양광 발전소 준공', category: '언론보도', date: '2024.01.14' },
                { title: '재생에너지 사업개발 담당자 모집', category: '채용', date: '2024.01.13' },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <span className="text-sm text-gray-400">{item.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 문의 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">최근 문의</h2>
            <div className="space-y-3">
              {[
                { name: '홍길동', category: '사업 제안', status: '대기중', date: '2024.01.15' },
                { name: '김철수', category: '투자 문의', status: '처리중', date: '2024.01.14' },
                { name: '이영희', category: '일반 문의', status: '완료', date: '2024.01.13' },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{item.name} - {item.category}</p>
                    <p className="text-sm text-gray-500">{item.date}</p>
                  </div>
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    item.status === '대기중' ? 'bg-yellow-100 text-yellow-800' :
                    item.status === '처리중' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 빠른 작업 */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">빠른 작업</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-3xl mb-2">📝</div>
              <p className="font-medium">새 게시글</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-3xl mb-2">🖼️</div>
              <p className="font-medium">팝업 등록</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-3xl mb-2">💼</div>
              <p className="font-medium">채용 공고</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-3xl mb-2">📊</div>
              <p className="font-medium">통계 보기</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

