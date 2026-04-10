'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import Image from 'next/image';

export default function AdminPopupPage() {
  const [showEditor, setShowEditor] = useState(false);

  // 샘플 데이터
  const popups = [
    { 
      id: 1, 
      title: '2024년 신규 프로젝트 모집', 
      type: 'main',
      startDate: '2024.01.01',
      endDate: '2024.12.31',
      isActive: true,
      imageUrl: '/images/popup1.jpg'
    },
    { 
      id: 2, 
      title: '이용약관', 
      type: 'terms',
      startDate: '2024.01.01',
      endDate: '2024.12.31',
      isActive: true,
      imageUrl: '/images/popup2.jpg'
    },
  ];

  const getTypeName = (type: string) => {
    switch (type) {
      case 'main': return '메인 팝업';
      case 'terms': return '이용약관';
      case 'privacy': return '개인정보처리방침';
      default: return type;
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">팝업 관리</h1>
            <p className="text-gray-600">팝업을 등록, 수정, 삭제할 수 있습니다.</p>
          </div>
          <button
            onClick={() => setShowEditor(true)}
            className="btn-primary"
          >
            새 팝업 등록
          </button>
        </div>

        {/* 팝업 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popups.map((popup) => (
            <div key={popup.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="w-full h-48 relative bg-gray-200">
                <Image
                  src={popup.imageUrl}
                  alt={popup.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm bg-primary text-white px-3 py-1 rounded">
                    {getTypeName(popup.type)}
                  </span>
                  <span className={`text-sm px-3 py-1 rounded ${
                    popup.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {popup.isActive ? '활성' : '비활성'}
                  </span>
                </div>
                <h3 className="font-bold mb-2">{popup.title}</h3>
                <div className="text-sm text-gray-600 mb-4">
                  <p>시작: {popup.startDate}</p>
                  <p>종료: {popup.endDate}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 border rounded hover:bg-gray-100 text-sm">
                    수정
                  </button>
                  <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 팝업 등록 모달 */}
        {showEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">새 팝업 등록</h2>
                <button onClick={() => setShowEditor(false)} className="text-2xl">&times;</button>
              </div>
              
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2">팝업 유형</label>
                  <select className="w-full px-4 py-3 border rounded-lg">
                    <option value="main">메인 팝업</option>
                    <option value="terms">이용약관</option>
                    <option value="privacy">개인정보처리방침</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">제목</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="제목을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">시작일</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">종료일</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">팝업 이미지</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full px-4 py-3 border rounded-lg"
                  />
                  <p className="text-sm text-gray-500 mt-2">권장 크기: 600x800px</p>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="active" defaultChecked />
                  <label htmlFor="active">즉시 활성화</label>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEditor(false)}
                    className="px-6 py-3 border rounded-lg hover:bg-gray-100"
                  >
                    취소
                  </button>
                  <button type="submit" className="btn-primary">
                    저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

