'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Footer() {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      <footer className="bg-black text-white py-12">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* 회사 정보 */}
            <div>
              <div className="w-40 h-12 relative mb-4">
                <Image
                  src="/images/logo-white.png"
                  alt="루트에너지"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-sm text-gray-400">
                주식회사 루트에너지<br />
                서울특별시 강남구
              </p>
            </div>

            {/* 빠른 링크 */}
            <div>
              <h3 className="font-bold mb-4">빠른 링크</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/user/company" className="hover:text-primary transition-colors">회사소개</Link></li>
                <li><Link href="/user/notice" className="hover:text-primary transition-colors">공지사항</Link></li>
                <li><Link href="/user/newsletter" className="hover:text-primary transition-colors">루트레터</Link></li>
                <li><Link href="/user/recruitment" className="hover:text-primary transition-colors">채용</Link></li>
              </ul>
            </div>

            {/* 문의 */}
            <div>
              <h3 className="font-bold mb-4">문의하기</h3>
              <ul className="space-y-2 text-sm">
                <li>이메일: info@rootenergy.co.kr</li>
                <li>전화: 02-XXXX-XXXX</li>
                <li>
                  <Link href="/inquiry" className="text-primary hover:underline">
                    온라인 문의
                  </Link>
                </li>
              </ul>
            </div>

            {/* 자료 다운로드 */}
            <div>
              <h3 className="font-bold mb-4">자료</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/downloads/company-profile.pdf" target="_blank" className="hover:text-primary transition-colors">
                    회사소개서
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => setShowTerms(true)}
                    className="hover:text-primary transition-colors"
                  >
                    이용약관
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowPrivacy(true)}
                    className="hover:text-primary transition-colors font-semibold"
                  >
                    개인정보처리방침
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} 루트에너지. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* 이용약관 팝업 */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">이용약관</h2>
              <button onClick={() => setShowTerms(false)} className="text-2xl">&times;</button>
            </div>
            <div className="prose">
              <p>이용약관 내용이 여기에 표시됩니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보처리방침 팝업 */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">개인정보처리방침</h2>
              <button onClick={() => setShowPrivacy(false)} className="text-2xl">&times;</button>
            </div>
            <div className="prose">
              <p>개인정보처리방침 내용이 여기에 표시됩니다.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

