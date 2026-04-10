'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function NoticePage() {
  // 실제로는 Firebase에서 데이터를 가져와야 함
  const notices = [
    { id: 1, title: '설 연휴 고객센터 운영 안내', date: '2024.02.01', views: 234, isImportant: true },
    { id: 2, title: '시스템 점검 안내', date: '2024.01.25', views: 189, isImportant: false },
    { id: 3, title: '개인정보처리방침 변경 안내', date: '2024.01.20', views: 156, isImportant: true },
    { id: 4, title: '2024년 신규 프로젝트 모집 안내', date: '2024.01.15', views: 312, isImportant: false },
  ];

  return (
    <div className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/capture/notice.png"
            alt="공지사항"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-blue-600/80"></div>
        </div>
        <div className="container-custom text-center text-white relative z-10">
          <h1 className="text-5xl font-bold mb-4">공지사항</h1>
          <p className="text-xl">루트에너지의 중요한 소식을 확인하세요</p>
        </div>
      </section>

      {/* 공지사항 목록 */}
      <section className="py-20">
        <div className="container-custom">
          {/* 테이블 형식 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">번호</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">제목</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">날짜</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">조회</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {notices.map((notice, index) => (
                    <tr key={notice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {notice.isImportant ? (
                          <span className="text-primary font-bold">공지</span>
                        ) : (
                          notices.length - index
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/user/notice/${notice.id}`}
                          className="text-gray-900 hover:text-primary font-medium"
                        >
                          {notice.isImportant && (
                            <span className="text-primary mr-2">[필독]</span>
                          )}
                          {notice.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{notice.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{notice.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 페이지네이션 */}
          <div className="flex justify-center mt-12 gap-2">
            <button className="px-4 py-2 border rounded hover:bg-gray-100">이전</button>
            <button className="px-4 py-2 bg-primary text-white rounded">1</button>
            <button className="px-4 py-2 border rounded hover:bg-gray-100">2</button>
            <button className="px-4 py-2 border rounded hover:bg-gray-100">3</button>
            <button className="px-4 py-2 border rounded hover:bg-gray-100">다음</button>
          </div>
        </div>
      </section>
    </div>
  );
}

