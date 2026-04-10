'use client';

import { useState } from 'react';

export default function InquiryPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    category: '일반 문의',
    subject: '',
    message: '',
    agree: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Firebase에 저장하는 로직 추가 예정
    alert('문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.');
  };

  return (
    <div className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative h-96 flex items-center justify-center bg-gradient-to-r from-primary to-blue-600">
        <div className="container-custom text-center text-white">
          <h1 className="text-5xl font-bold mb-4">문의하기</h1>
          <p className="text-xl">궁금하신 사항을 남겨주시면 빠르게 답변 드리겠습니다</p>
        </div>
      </section>

      {/* 문의 폼 */}
      <section className="py-20">
        <div className="container-custom max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2">이름 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">이메일 *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2">연락처 *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="010-0000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">회사명</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="회사명을 입력하세요"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">문의 유형 *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>일반 문의</option>
                <option>사업 제안</option>
                <option>제휴 문의</option>
                <option>투자 문의</option>
                <option>채용 문의</option>
                <option>기타</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">제목 *</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">문의 내용 *</label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="문의 내용을 자세히 입력해주세요"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agree"
                required
                checked={formData.agree}
                onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                className="mt-1"
              />
              <label htmlFor="agree" className="text-sm text-gray-600">
                개인정보 수집 및 이용에 동의합니다. 
                수집된 정보는 문의 답변 목적으로만 사용되며, 답변 완료 후 즉시 파기됩니다.
              </label>
            </div>

            <div className="text-center">
              <button type="submit" className="btn-primary px-12 py-4 text-lg">
                문의 보내기
              </button>
            </div>
          </form>

          {/* 연락처 정보 */}
          <div className="mt-16 pt-16 border-t">
            <h2 className="text-2xl font-bold mb-8 text-center">기타 연락처</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl mb-4">📞</div>
                <h3 className="font-bold mb-2">전화 문의</h3>
                <p className="text-gray-600">02-XXXX-XXXX</p>
                <p className="text-sm text-gray-500">평일 09:00 - 18:00</p>
              </div>
              <div>
                <div className="text-4xl mb-4">✉️</div>
                <h3 className="font-bold mb-2">이메일</h3>
                <p className="text-gray-600">info@rootenergy.co.kr</p>
                <p className="text-sm text-gray-500">24시간 접수 가능</p>
              </div>
              <div>
                <div className="text-4xl mb-4">📍</div>
                <h3 className="font-bold mb-2">오시는 길</h3>
                <p className="text-gray-600">서울특별시 강남구</p>
                <p className="text-sm text-gray-500">지하철 2호선 강남역</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

