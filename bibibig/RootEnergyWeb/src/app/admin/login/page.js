'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Firebase 인증 로직 추가 예정
      // const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 임시 로그인 처리
      if (formData.email === 'admin@rootenergy.com' && formData.password === 'admin123') {
        localStorage.setItem('isAdminLoggedIn', 'true');
        if (formData.rememberMe) {
          localStorage.setItem('adminEmail', formData.email);
        }
        router.push('/admin/dashboard');
      } else {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">루트에너지</h1>
          <p className="text-gray-600">관리자 로그인</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">이메일</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="admin@rootenergy.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">비밀번호</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={formData.rememberMe}
              onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="rememberMe" className="text-sm text-gray-600">
              로그인 정보 저장
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>문제가 있으신가요?</p>
          <a href="mailto:admin@rootenergy.com" className="text-primary hover:underline">
            관리자에게 문의하기
          </a>
        </div>
      </div>
    </div>
  );
}

