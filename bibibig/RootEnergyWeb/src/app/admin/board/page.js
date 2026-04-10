'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminBoardPage() {
  const [selectedType, setSelectedType] = useState('press');
  const [showEditor, setShowEditor] = useState(false);

  const boardTypes = [
    { id: 'press', name: '언론보도' },
    { id: 'newsletter', name: '뉴스레터' },
    { id: 'notice', name: '공지사항' },
    { id: 'recruitment', name: '채용' },
    { id: 'inquiry', name: '문의' },
  ];

  // 샘플 데이터
  const posts = [
    { id: 1, title: '루트에너지, OO 지역 태양광 발전소 준공', date: '2024.01.15', views: 120, published: true },
    { id: 2, title: '재생에너지 전문기업 루트에너지 지역상생 모델 주목', date: '2024.01.10', views: 95, published: true },
    { id: 3, title: 'RE100 달성 지원하는 루트에너지 솔루션', date: '2024.01.05', views: 180, published: false },
  ];

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">게시판 관리</h1>
            <p className="text-gray-600">게시글을 등록, 수정, 삭제할 수 있습니다.</p>
          </div>
          <button
            onClick={() => setShowEditor(true)}
            className="btn-primary"
          >
            새 게시글 작성
          </button>
        </div>

        {/* 게시판 타입 선택 */}
        <div className="flex gap-3 mb-6">
          {boardTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-6 py-2 rounded-lg transition-colors ${
                selectedType === type.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>

        {/* 게시글 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold">제목</th>
                <th className="px-6 py-4 text-left text-sm font-bold">날짜</th>
                <th className="px-6 py-4 text-left text-sm font-bold">조회수</th>
                <th className="px-6 py-4 text-left text-sm font-bold">상태</th>
                <th className="px-6 py-4 text-left text-sm font-bold">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{post.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{post.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{post.views}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      post.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {post.published ? '게시중' : '미게시'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:underline text-sm">수정</button>
                      <button className="text-red-600 hover:underline text-sm">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 에디터 모달 */}
        {showEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">새 게시글 작성</h2>
                <button onClick={() => setShowEditor(false)} className="text-2xl">&times;</button>
              </div>
              
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2">게시판 선택</label>
                  <select className="w-full px-4 py-3 border rounded-lg">
                    {boardTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
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

                <div>
                  <label className="block text-sm font-bold mb-2">카테고리</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="카테고리를 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">내용</label>
                  <textarea
                    rows={12}
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="내용을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">썸네일 이미지</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full px-4 py-3 border rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="publish" />
                  <label htmlFor="publish">즉시 게시</label>
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

