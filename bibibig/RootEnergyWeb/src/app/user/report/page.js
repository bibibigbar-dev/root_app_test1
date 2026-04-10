'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ReportPage() {
  const [category, setCategory] = useState('전체');
  const categories = ['전체', '신문', '방송', '웹진'];

  // 실제로는 Firebase에서 데이터를 가져와야 함
  const pressData = [
    { id: 1, title: '루트에너지, OO 지역 태양광 발전소 준공', category: '신문', date: '2024.01.15', views: 120 },
    { id: 2, title: '재생에너지 전문기업 루트에너지 지역상생 모델 주목', category: '웹진', date: '2024.01.10', views: 95 },
    { id: 3, title: 'RE100 달성 지원하는 루트에너지 솔루션', category: '방송', date: '2024.01.05', views: 180 },
  ];

  return (
    <div className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/capture/report.png"
            alt="언론보도"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-blue-600/80"></div>
        </div>
        <div className="container-custom text-center text-white relative z-10">
          <h1 className="text-5xl font-bold mb-4">언론보도</h1>
          <p className="text-xl">루트에너지의 다양한 소식을 만나보세요</p>
        </div>
      </section>

      {/* 컨텐츠 영역 */}
      <section className="py-20">
        <div className="container-custom">
          {/* 카테고리 필터 */}
          <div className="flex gap-4 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-6 py-2 rounded-full transition-colors ${
                  category === cat
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 게시글 목록 */}
          <div className="space-y-4">
            {pressData.map((item) => (
              <Link
                key={item.id}
                href={`/user/report/${item.id}`}
                className="block bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm bg-primary text-white px-3 py-1 rounded">
                        {item.category}
                      </span>
                      <span className="text-sm text-gray-500">{item.date}</span>
                      <span className="text-sm text-gray-500">조회 {item.views}</span>
                    </div>
                    <h3 className="text-xl font-bold hover:text-primary">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
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

