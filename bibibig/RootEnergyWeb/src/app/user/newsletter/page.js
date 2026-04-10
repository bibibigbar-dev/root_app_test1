'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function NewsletterPage() {
  // 실제로는 Firebase에서 데이터를 가져와야 함
  const newsletters = [
    { id: 1, title: '루트레터 2024년 1월호', date: '2024.01.15', description: '새해를 맞아 루트에너지의 2024년 계획을 소개합니다.', thumbnail: '/images/newsletter1.jpg' },
    { id: 2, title: '루트레터 2023년 12월호', date: '2023.12.15', description: '2023년 한 해를 돌아보며 주요 성과를 정리했습니다.', thumbnail: '/images/newsletter2.jpg' },
    { id: 3, title: '루트레터 2023년 11월호', date: '2023.11.15', description: '재생에너지 산업의 최신 동향을 전해드립니다.', thumbnail: '/images/newsletter3.jpg' },
  ];

  return (
    <div className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/capture/newsletter.png"
            alt="뉴스레터"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-blue-600/80"></div>
        </div>
        <div className="container-custom text-center text-white relative z-10">
          <h1 className="text-5xl font-bold mb-4">루트레터</h1>
          <p className="text-xl">루트에너지의 소식을 정기적으로 받아보세요</p>
        </div>
      </section>

      {/* 구독 섹션 */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">뉴스레터 구독하기</h2>
            <p className="text-gray-600 mb-6">
              이메일을 입력하시면 매월 루트에너지의 소식을 받아보실 수 있습니다.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="이메일 주소를 입력하세요"
                className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="btn-primary">구독하기</button>
            </div>
          </div>
        </div>
      </section>

      {/* 뉴스레터 목록 */}
      <section className="py-20">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">지난 뉴스레터</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {newsletters.map((item) => (
              <Link
                key={item.id}
                href={`/user/newsletter/${item.id}`}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="w-full h-64 relative bg-gray-200">
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="text-sm text-gray-500 mb-2">{item.date}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
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

