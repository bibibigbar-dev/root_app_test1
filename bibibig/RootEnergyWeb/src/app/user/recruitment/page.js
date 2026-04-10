'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function RecruitmentPage() {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const categories = ['전체', '회계', '사업개발', '경영지원', '홍보/마케팅', '지역상생', '디자인'];

  // 실제로는 Firebase에서 데이터를 가져와야 함
  const jobPostings = [
    { 
      id: 1, 
      title: '재생에너지 사업개발 담당자', 
      category: '사업개발', 
      type: '정규직',
      experience: '경력 3년 이상',
      deadline: '2024.02.15',
      location: '서울 강남구'
    },
    { 
      id: 2, 
      title: '마케팅 매니저', 
      category: '홍보/마케팅', 
      type: '정규직',
      experience: '경력 5년 이상',
      deadline: '2024.02.20',
      location: '서울 강남구'
    },
    { 
      id: 3, 
      title: 'UI/UX 디자이너', 
      category: '디자인', 
      type: '정규직',
      experience: '경력 3년 이상',
      deadline: '2024.02.25',
      location: '서울 강남구'
    },
  ];

  const filteredJobs = selectedCategory === '전체' 
    ? jobPostings 
    : jobPostings.filter(job => job.category === selectedCategory);

  return (
    <div className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/capture/recruitment.png"
            alt="채용"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-blue-600/80"></div>
        </div>
        <div className="container-custom text-center text-white relative z-10">
          <h1 className="text-5xl font-bold mb-4">채용</h1>
          <p className="text-xl">루트에너지와 함께 미래를 만들어갈 인재를 찾습니다</p>
        </div>
      </section>

      {/* 채용 정보 */}
      <section className="py-20">
        <div className="container-custom">
          {/* 회사 소개 */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">루트에너지에서 함께 성장하세요</h2>
            <p className="text-lg text-gray-600 mb-4">
              루트에너지는 지역과 함께 성장하는 재생에너지 전문기업입니다.
            </p>
            <p className="text-gray-600">
              혁신적인 사고와 열정을 가진 인재들과 함께 지속가능한 미래를 만들어가고 있습니다.
            </p>
          </div>

          {/* 복지 혜택 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-bold mb-2">경쟁력 있는 연봉</h3>
              <p className="text-sm text-gray-600">역량에 따른 합리적 보상</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">🏖️</div>
              <h3 className="font-bold mb-2">워라밸</h3>
              <p className="text-sm text-gray-600">유연근무제, 리프레시 휴가</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="font-bold mb-2">성장 지원</h3>
              <p className="text-sm text-gray-600">교육비, 도서비 지원</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">🏥</div>
              <h3 className="font-bold mb-2">건강 관리</h3>
              <p className="text-sm text-gray-600">종합건강검진, 의료비 지원</p>
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 채용 공고 목록 */}
          <div className="space-y-6">
            {filteredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/user/recruitment/${job.id}`}
                className="block bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm bg-primary text-white px-3 py-1 rounded">
                        {job.category}
                      </span>
                      <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded">
                        {job.type}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 hover:text-primary">
                      {job.title}
                    </h3>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>📍 {job.location}</span>
                      <span>💼 {job.experience}</span>
                      <span>📅 ~{job.deadline}</span>
                    </div>
                  </div>
                  <button className="btn-primary">
                    지원하기
                  </button>
                </div>
              </Link>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              해당 카테고리의 채용 공고가 없습니다.
            </div>
          )}
        </div>
      </section>

      {/* 채용 프로세스 */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <h2 className="section-title text-center">채용 프로세스</h2>
          <div className="max-w-5xl mx-auto mt-12">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { step: '01', title: '서류 전형', desc: '이력서 및 자기소개서 검토' },
                { step: '02', title: '1차 면접', desc: '직무 역량 면접' },
                { step: '03', title: '2차 면접', desc: '임원 면접' },
                { step: '04', title: '처우 협의', desc: '연봉 및 입사일 협의' },
                { step: '05', title: '최종 합격', desc: '입사 및 온보딩' },
              ].map((item, index) => (
                <div key={item.step} className="relative">
                  <div className="bg-white p-6 rounded-lg text-center shadow-md">
                    <div className="text-2xl font-bold text-primary mb-2">{item.step}</div>
                    <div className="font-bold mb-2">{item.title}</div>
                    <div className="text-sm text-gray-600">{item.desc}</div>
                  </div>
                  {index < 4 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 transform translate-x-1/2 -translate-y-1/2 text-primary text-2xl">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

