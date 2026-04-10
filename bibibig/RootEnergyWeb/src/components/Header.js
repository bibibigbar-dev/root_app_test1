'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState({
    solution: false,
    newsroom: false,
  });
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState({
    solution: false,
    newsroom: false,
  });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0;
      setScrollProgress(progress);
      
      // 스크롤 50px 이상 내려가면 배경 표시
      setIsScrolled(scrollTop > 50);
    };

    // 초기 로드 시에도 스크롤 위치 체크
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className="fixed top-0 w-full z-50 transition-all duration-300 border-b"
      style={{
        backgroundColor: isScrolled ? '#ffffff' : 'transparent',
        boxShadow: 'none',
        borderBottomColor: isScrolled ? '#e5e7eb' : 'rgba(255,255,255,0.3)'
      }}
    >
      {/* 스크롤 진행 바 배경 */}
      <div 
        className="absolute top-0 left-0 h-1 w-full z-[60]" 
        style={{ backgroundColor: isScrolled ? '#e5e7eb' : '#ffffff' }}
      ></div>
      {/* 스크롤 진행 바 */}
      <div 
        className="absolute top-0 left-0 h-1 bg-primary transition-all duration-300 z-[70]" 
        style={{ width: `${scrollProgress}%` }}
      ></div>
      
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 lg:h-24">
          {/* 좌측: 로고 (고정 폭) */}
          <div className="w-40 lg:w-56 flex items-center">
            <Link href="/" className="flex items-center">
              <div className="w-40 h-12 lg:w-56 lg:h-18 relative">
                <Image
                  src={isScrolled ? "/images/logo.png" : "/images/logo_white.png"}
                  alt="루트에너지"
                  fill
                  className="object-contain transition-opacity duration-300"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* 가운데: 데스크톱 메뉴 (정중앙 정렬) */}
          <nav className="hidden lg:flex flex-1 items-center justify-center space-x-20">
            <Link href="/user/company" className={`text-xl ${isScrolled ? 'text-black' : 'text-white'} hover:text-gray-400 transition-colors duration-300 font-medium`}>
              회사소개
            </Link>
            
            {/* 솔루션 드롭다운 */}
            <div 
              className="relative group"
              onMouseEnter={() => setIsDropdownOpen({ ...isDropdownOpen, solution: true })}
              onMouseLeave={() => setIsDropdownOpen({ ...isDropdownOpen, solution: false })}
            >
              <button className={`text-xl ${isScrolled ? 'text-black' : 'text-white'} hover:text-gray-400 transition-colors duration-300 font-medium`}>
                솔루션
              </button>
              {isDropdownOpen.solution && (
                <>
                  {/* 투명한 연결 영역 */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-56 h-5" style={{ top: '100%' }}></div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-56 bg-white border border-gray-200 shadow-xl rounded-md py-2" style={{ top: 'calc(100% + 20px)' }}>
                    <Link href="/user/solution01" className="block px-6 py-4 text-lg text-gray-700 hover:bg-primary hover:text-white transition-colors">
                      지역수용성 솔루션
                    </Link>
                    <Link href="/user/solution02" className="block px-6 py-4 text-lg text-gray-700 hover:bg-primary hover:text-white transition-colors">
                      지역주도 사업개발
                    </Link>
                    <Link href="/user/solution03" className="block px-6 py-4 text-lg text-gray-700 hover:bg-primary hover:text-white transition-colors">
                      RE100/탄소중립 솔루션
                    </Link>
                    <Link href="/user/solution04" className="block px-6 py-4 text-lg text-gray-700 hover:bg-primary hover:text-white transition-colors">
                      시민펀드
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* 뉴스룸 드롭다운 */}
            <div 
              className="relative group"
              onMouseEnter={() => setIsDropdownOpen({ ...isDropdownOpen, newsroom: true })}
              onMouseLeave={() => setIsDropdownOpen({ ...isDropdownOpen, newsroom: false })}
            >
              <button className={`text-xl ${isScrolled ? 'text-black' : 'text-white'} hover:text-gray-400 transition-colors duration-300 font-medium`}>
                뉴스룸
              </button>
              {isDropdownOpen.newsroom && (
                <>
                  {/* 투명한 연결 영역 */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-44 h-5" style={{ top: '100%' }}></div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-44 bg-white border border-gray-200 shadow-xl rounded-md py-2" style={{ top: 'calc(100% + 20px)' }}>
                    <Link href="/user/report" className="block px-6 py-4 text-lg text-gray-700 hover:bg-primary hover:text-white transition-colors">
                      언론보도
                    </Link>
                    <Link href="/user/newsletter" className="block px-6 py-4 text-lg text-gray-700 hover:bg-primary hover:text-white transition-colors">
                      뉴스레터
                    </Link>
                    <Link href="/user/notice" className="block px-6 py-4 text-lg text-gray-700 hover:bg-primary hover:text-white transition-colors">
                      공지사항
                    </Link>
                  </div>
                </>
              )}
            </div>

            <Link href="/user/recruitment" className={`text-xl ${isScrolled ? 'text-black' : 'text-white'} hover:text-gray-400 transition-colors duration-300 font-medium`}>
              채용
            </Link>
          </nav>

          {/* 우측: ROOTFUND 버튼 (데스크톱만 표시) */}
          <div className="hidden lg:flex w-56 items-center justify-end">
            <Link
              href="/user/solution04"
              aria-label="ROOTFUND 바로가기"
              className={`inline-flex items-center justify-center rounded-full border px-8 py-1 transition-colors ${
                isScrolled
                  ? 'border-gray-300 bg-white hover:bg-gray-50'
                  : 'border-white/60 bg-white/10 hover:bg-white/15'
              }`}
            >
              <span className="relative w-40 h-10">
                <Image
                  src={isScrolled ? "/images/logo_rootfund.png" : "/images/logo_rootfund_white.png"}
                  alt="ROOTFUND"
                  fill
                  className="object-contain"
                  priority
                />
              </span>
            </Link>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button
            className={`lg:hidden p-2 ${isScrolled ? 'text-black' : 'text-white'}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="메뉴"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 모바일 사이드바 오버레이 */}
      {isMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* 모바일 사이드바 메뉴 */}
      <div 
        className={`lg:hidden fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 닫기 버튼 */}
        <div className="flex justify-end p-4 border-b">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 text-gray-600 hover:text-black"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 메뉴 내용 */}
        <div className="overflow-y-auto h-full pb-32">
          <div className="px-6 py-4">
            {/* 회사소개 */}
            <Link 
              href="/user/company" 
              className="block py-4 text-xl font-medium text-black border-b hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              회사소개
              <svg className="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            {/* 솔루션 */}
            <div className="py-4 border-b">
              <button 
                onClick={() => setIsMobileDropdownOpen({ ...isMobileDropdownOpen, solution: !isMobileDropdownOpen.solution })}
                className="flex items-center justify-between mb-3 w-full"
              >
                <span className="text-xl font-medium text-black">솔루션</span>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${isMobileDropdownOpen.solution ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isMobileDropdownOpen.solution && (
                <>
                  <Link 
                    href="/user/solution01" 
                    className="block py-3 text-lg text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    지역수용성 솔루션
                  </Link>
                  <Link 
                    href="/user/solution02" 
                    className="block py-3 text-lg text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    지역주도 사업개발
                  </Link>
                  <Link 
                    href="/user/solution03" 
                    className="block py-3 text-lg text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    RE100/탄소중립 솔루션
                  </Link>
                  <Link 
                    href="/user/solution04" 
                    className="block py-3 text-lg text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    시민펀드
                  </Link>
                </>
              )}
            </div>
            
            {/* 뉴스룸 */}
            <div className="py-4 border-b">
              <button 
                onClick={() => setIsMobileDropdownOpen({ ...isMobileDropdownOpen, newsroom: !isMobileDropdownOpen.newsroom })}
                className="flex items-center justify-between mb-3 w-full"
              >
                <span className="text-xl font-medium text-black">뉴스룸</span>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${isMobileDropdownOpen.newsroom ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isMobileDropdownOpen.newsroom && (
                <>
                  <Link 
                    href="/user/report" 
                    className="block py-3 text-lg text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    언론보도
                  </Link>
                  <Link 
                    href="/user/newsletter" 
                    className="block py-3 text-lg text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    뉴스레터
                  </Link>
                  <Link 
                    href="/user/notice" 
                    className="block py-3 text-lg text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    공지사항
                  </Link>
                </>
              )}
            </div>
            
            {/* 채용 */}
            <Link 
              href="/user/recruitment" 
              className="block py-4 text-xl font-medium text-black border-b hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              채용
              <svg className="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* ROOTFUND 버튼 - 맨 아래 */}
          <div className="px-6 py-6 mt-8">
            <Link
              href="/user/solution04"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 px-8 py-3 transition-colors"
            >
              <span className="relative w-40 h-10">
                <Image
                  src="/images/logo_rootfund.png"
                  alt="ROOTFUND"
                  fill
                  className="object-contain"
                />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

