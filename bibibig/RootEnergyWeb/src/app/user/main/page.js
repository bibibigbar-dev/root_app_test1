'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';

export default function MainPage() {
  const newsRef = useRef(null);
  const solutionRefs = useRef([]);
  const [visibleSolutions, setVisibleSolutions] = useState([]);
  const [selectedSolutionTab, setSelectedSolutionTab] = useState('지역수용성 솔루션');

  // 솔루션 카드 스크롤 애니메이션
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index);
            setVisibleSolutions((prev) => [...new Set([...prev, index])]);
          }
        });
      },
      { threshold: 0.2 }
    );

    solutionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // YouTube 플레이어 옵션
  const youtubeOpts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      mute: 1,
      loop: 1,
      playlist: 'HbAV_AULiAs', // 동영상 ID (루프를 위해 필요)
      playsinline: 1,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
    },
  };

  const onPlayerReady = (event) => {
    event.target.mute();
    event.target.playVideo();
  };

  const solutions = [
    {
      title: '햇빛바람 시민펀드',
      subtitle: 'SOLUTION 01',
      description: '국내 1위 햇빛바람 펀드\n운용사로 지역 이익을\n극대화 합니다.',
      mobileDescription: '국내 1위 햇빛바람 펀드 운용사로\n지역 이익을 극대화 합니다.',
      image: '/images/main_solution01.png',
      link: '/user/solution01'
    },
    {
      title: '지역수용성 솔루션',
      subtitle: 'SOLUTION 02',
      description: '국내 1위 전문성으로\n사업 위험을 낮추고,\n지역을 살립니다.',
      mobileDescription: '국내 1위 전문성으로 사업 위험을 낮추고,\n지역을 살립니다.',
      image: '/images/main_solution02.png',
      link: '/user/solution02'
    },
    {
      title: '지역공동소유 사업개발',
      subtitle: 'SOLUTION 03',
      description: '주민과 지자체가\n주도하는 사업 개발을\n돕습니다.',
      mobileDescription: '주민과 지자체가 주도하는\n사업 개발을 돕습니다.',
      image: '/images/main_solution03.png',
      link: '/user/solution03'
    },
    {
      title: 'RE100 솔루션',
      subtitle: 'SOLUTION 04',
      description: '맞춤형 원스탑 서비스로\nRE100 달성을\n가속화 합니다.',
      mobileDescription: '맞춤형 원스탑 서비스로\nRE100 달성을 가속화 합니다.',
      image: '/images/main_solution04.png',
      link: '/user/solution04'
    }
  ];

  const solutionStats = {
    '지역수용성 솔루션': [
      { labelPart1: '루트에너지가 진행한', labelPart2: '지용성 솔루션 프로젝트', value: '39', unit: '개' },
      { labelPart1: '지용성 솔루션', labelPart2: '설비용량', value: '16.4', unit: 'GW' },
      { labelPart1: '루트에너지가 진행한', labelPart2: '주민 펀드 규모', value: '약 5.4', unit: '조원' }
    ],
    '주민주도IPP': [
      { labelPart1: '루트에너지가 진행한', labelPart2: '자문건수', value: '13', unit: '건' },
      { labelPart1: 'RE100', labelPart2: '전환전력량', value: '8.7', unit: 'GW' },
      { labelPart1: '솔루션', labelPart2: '달성률', value: '100', unit: '%' }
    ],
    'RE100/탄소중립 솔루션': [
      { labelPart1: '루트에너지가 진행한', labelPart2: '총 투자비 규모', value: '약 8', unit: '조원' },
      { labelPart1: '주민주도 IPP', labelPart2: '설비용량', value: '1.2', unit: 'GW' },
      { labelPart1: '루트에너지가 진행한', labelPart2: '주민주도 IPP 프로젝트', value: '3', unit: '개' }
    ]
  };

  const news = [
    {
      id: 1,
      image: '/images/news01.jpg',
      title: '루트에너지, 혁신적인 재생에너지 솔루션 공개',
      date: '2024.01.15'
    },
    {
      id: 2,
      image: '/images/news02.jpg',
      title: '지역 주민과 함께하는 태양광 발전소 준공',
      date: '2024.01.10'
    },
    {
      id: 3,
      image: '/images/news03.jpg',
      title: 'RE100 달성을 위한 기업 맞춤형 솔루션',
      date: '2024.01.05'
    },
    {
      id: 4,
      image: '/images/news04.jpg',
      title: '탄소중립 실현을 위한 새로운 도전',
      date: '2024.01.01'
    }
  ];

  const partners = [
    { name: '산업은행', logo: '/images/partners/partner01.png' },
    { name: '비츠로셀', logo: '/images/partners/partner02.png' },
    { name: 'mysc', logo: '/images/partners/partner03.png' },
    { name: 'POSCO', logo: '/images/partners/partner04.png' },
    { name: 'LGUPLUS', logo: '/images/partners/partner05.png' },
    { name: 'D3', logo: '/images/partners/partner06.png' },
    { name: 'KT Estate', logo: '/images/partners/partner07.png' },
    { name: '전북은행', logo: '/images/partners/partner08.png' },
    { name: 'SK ecoplant', logo: '/images/partners/partner09.png' },
    { name: '동국대학교', logo: '/images/partners/partner10.png' },
    { name: '경상국립대', logo: '/images/partners/partner11.png' },
    { name: '한국관광공사', logo: '/images/partners/partner12.png' },
  ];

  const scrollNews = (direction) => {
    if (newsRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      newsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white">
      {/* 히어로 섹션 - YouTube 배경 */}
      {/* 
        NOTE: layout의 <main className="pt-20"> (고정 헤더 높이 80px) 때문에
        히어로가 헤더 아래에서 시작하므로, -mt-20으로 위로 당겨
        동영상 배경이 헤더 뒤까지 보이도록 합니다.
      */}
      <section className="relative -mt-20 h-[100svh] md:h-screen flex items-center justify-center overflow-hidden bg-white">
        {/* YouTube 배경 동영상 */}
        <div className="absolute inset-0 z-0 bg-white">
          {/* 
            YouTube는 내부적으로 16:9 레터박스(검정 여백)를 넣을 수 있어서,
            iframe 자체를 "cover"처럼 크게 깔고(크롭) 여백이 화면에 보이지 않게 합니다.
          */}
          <div className="yt-cover">
            <YouTube
              videoId="HbAV_AULiAs"
              opts={youtubeOpts}
              onReady={onPlayerReady}
              className="yt-cover__inner"
              iframeClassName="yt-cover__iframe"
            />
          </div>
          {/* 오버레이 */}
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        
        {/* 컨텐츠 */}
        <div className="container-custom text-center text-white relative z-10 px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 break-keep" style={{ lineHeight: '1.2' }}>
            사람과 지역 중심의 재생에너지 사업으로 기후 위기와 지역소멸 해결을 가속화합니다.
          </h1>
        </div>

        {/* 하단 스크롤 인디케이터 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* 솔루션 섹션 */}
      <section className="py-20 md:py-32 bg-white mt-10 md:mt-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-primary font-bold text-lg md:text-xl" style={{ marginBottom: '24px' }}>솔루션 소개</p>
            <h2 className="font-normal mb-4 text-2xl md:text-[41px]" style={{ lineHeight: '1.4' }}>
              {/* 모바일용 텍스트 */}
              <span className="md:hidden">
                재생에너지 <span className="font-bold">사업 기간을 단축하고</span>
                <br />
                <span className="font-bold">사회환경적 가치를 극대화</span>하는
                <br />
                혁신적인 솔루션 제공
              </span>
              {/* 데스크탑용 텍스트 */}
              <span className="hidden md:inline">
                재생에너지 <span className="font-bold">사업 기간을 단축하고 사회환경적</span>
                <br />
                <span className="font-bold">가치를 극대화</span>하는 혁신적인 솔루션 제공
              </span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {solutions.map((solution, index) => (
              <Link
                key={index}
                ref={(el) => (solutionRefs.current[index] = el)}
                data-index={index}
                href={solution.link}
                className={`group relative transition-all duration-700 ${
                  visibleSolutions.includes(index)
                    ? 'opacity-100 translate-y-0'
                    : index % 2 === 0
                    ? 'opacity-0 -translate-y-20'
                    : 'opacity-0 translate-y-20'
                } ${
                  index % 2 === 0 ? 'md:mt-0 md:mb-16' : 'md:mt-16 md:mb-0'
                }`}
                style={{ 
                  transitionDelay: `${index * 100}ms`
                }}
              >
                <div 
                  className="relative overflow-hidden flex flex-col justify-end shadow-lg md:hover:shadow-2xl transition-shadow duration-300 min-h-[380px] md:min-h-[600px]"
                  style={{ 
                    borderRadius: '20px',
                    padding: '35px 7%'
                  }}
                >
                  {/* 배경 이미지 */}
                <Image
                    src={solution.image}
                    alt={solution.title}
                  fill
                    className="object-cover -z-10"
                />
                  
                  {/* 호버 시 어두워지는 오버레이 (데스크탑만) */}
                  <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/40 transition-all duration-500 -z-10"></div>
                  
                  {/* 하단 그라데이션 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent -z-10"></div>
                  
                  {/* 텍스트 컨텐츠 */}
                  <div className="relative z-10 text-white">
                    {/* 모바일: 항상 보이기 / 데스크탑: 호버 시 슬라이드 */}
                    <div className="md:translate-y-[140px] md:group-hover:translate-y-0 md:transition-transform md:duration-[600ms] md:ease-linear">
                      {/* 서브타이틀 */}
                      <p className="text-left mb-1" style={{ lineHeight: '1.4' }}>
                        <span className="text-xs md:text-sm">
                          <span style={{ color: '#B4D2FF' }}>
                            <s><em>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</em></s>
                          </span>
                          <em><span style={{ color: '#B4D2FF' }}>　{solution.subtitle}</span></em>
                        </span>
                      </p>

                      {/* 제목 - 모바일: 16px 간격 / 데스크탑: 호버 시 108px->32px */}
                      <div className="pb-[16px] md:pb-[108px] md:group-hover:pb-[32px] md:transition-[padding] md:duration-[600ms] md:ease-linear">
                        <p style={{ lineHeight: '1.3' }}>
                          <span className="text-white text-[24px] md:text-[30px] font-bold break-keep" style={{ letterSpacing: '-1px' }}>
                            {solution.title}
                          </span>
                        </p>
              </div>

                      {/* 설명: 모바일에서는 항상 보이기 / 데스크탑에서는 페이드 인/아웃 */}
                      <div className="h-[64px] md:h-[96px] overflow-hidden">
                        {/* 모바일용 설명 */}
                        <span 
                          className="md:hidden text-[#eeeeee] text-[16px] block whitespace-pre-line break-keep" 
                          style={{ lineHeight: '1.5' }}
                        >
                          {solution.mobileDescription}
                        </span>
                        {/* 데스크탑용 설명 */}
                        <span 
                          className="hidden md:block text-[#eeeeee] text-[20px] whitespace-pre-line break-keep opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] ease-linear" 
                          style={{ lineHeight: '1.5' }}
                        >
                          {solution.description}
                        </span>
                      </div>
                    </div>
              </div>
              </div>
            </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-20 text-white relative overflow-hidden">
        {/* 배경 이미지 - 웹/모바일 분리 */}
        <div className="absolute inset-0 z-0">
          <div className="hidden md:block absolute inset-0">
            <Image
              src="/images/main_result_back.png"
              alt="배경"
              fill
              className="object-cover"
            />
          </div>
          <div className="md:hidden absolute inset-0">
            <Image
              src="/images/main_result_back_mobile.png"
              alt="배경"
              fill
              className="object-cover"
            />
          </div>
        </div>
        
        {/* 그라데이션 오버레이 - 상단 파란색, 하단 연한 초록색 */}
        <div className="absolute inset-0 z-[5] bg-gradient-to-b from-primary/70 via-blue-500/50 to-emerald-200/50"></div>

        <div className="container-custom relative z-10 py-12">
          {/* 주요 성과 제목 */}
          <div className="text-left" style={{ marginTop: '36px' }}>
            <p className="mb-4 text-base md:text-xl" style={{ color: '#B4D2FF', fontWeight: 'bold' }}>
              주요 성과
            </p>
            <h2 className="text-left mb-8 text-2xl md:text-[42px]" style={{ fontWeight: 400, letterSpacing: '-1px', lineHeight: '1.4' }}>
              기업, 시민, 지자체와 함께하는{' '}
              <strong style={{ fontWeight: 800 }}>재생에너지</strong>
              <br />
              <strong style={{ fontWeight: 800 }}>솔루션으로</strong>{' '}
              탄소중립에 앞장서고 있습니다.
            </h2>
          </div>

          {/* 솔루션 탭과 통계 데이터 - 좌우 레이아웃 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12" style={{ marginTop: '90px' }}>
            {/* 왼쪽: 솔루션 탭 */}
            <div className="space-y-4">
              <button
                onClick={() => setSelectedSolutionTab('지역수용성 솔루션')}
                className="text-left w-full transition-opacity duration-300 hover:opacity-80"
              >
                <h3 className="text-3xl md:text-[48px]" style={{ fontWeight: 'bold', color: selectedSolutionTab === '지역수용성 솔루션' ? '#fff' : 'rgba(255, 255, 255, 0.5)' }}>
                  지역수용성 솔루션
                </h3>
              </button>
              <button
                onClick={() => setSelectedSolutionTab('주민주도IPP')}
                className="text-left w-full transition-opacity duration-300 hover:opacity-80"
              >
                <h3 className="text-3xl md:text-[48px]" style={{ fontWeight: 'bold', color: selectedSolutionTab === '주민주도IPP' ? '#fff' : 'rgba(255, 255, 255, 0.5)' }}>
                  주민주도IPP
                </h3>
              </button>
              <button
                onClick={() => setSelectedSolutionTab('RE100/탄소중립 솔루션')}
                className="text-left w-full transition-opacity duration-300 hover:opacity-80"
              >
                <h3 className="text-3xl md:text-[48px]" style={{ fontWeight: 'bold', color: selectedSolutionTab === 'RE100/탄소중립 솔루션' ? '#fff' : 'rgba(255, 255, 255, 0.5)' }}>
                  RE100/탄소중립 솔루션
                </h3>
              </button>
            </div>

            {/* 오른쪽: 통계 데이터 */}
            <div className="space-y-8">
              {solutionStats[selectedSolutionTab]?.map((stat, index) => (
                <div key={index} className="flex flex-col md:flex-row items-start md:items-center">
                  {/* 왼쪽: 설명 */}
                  <div className="w-full md:w-[45%] pr-0 md:pr-4 mb-4 md:mb-0">
                    <p className="mb-2 text-lg md:text-[22px]" style={{ fontWeight: 300, lineHeight: '1' }}>
                      {stat.labelPart1}
                    </p>
                    <p className="text-lg md:text-[22px]" style={{ fontWeight: 'bold' }}>
                      {stat.labelPart2}
                    </p>
                  </div>
                  {/* 오른쪽: 숫자 */}
                  <div className="w-full md:w-[55%] text-left">
                    <div className="flex items-baseline">
                      <h6 className="inline-block text-5xl md:text-[5em]" style={{ letterSpacing: '-1px', color: '#fff', fontWeight: 900 }}>
                        {stat.value}
                      </h6>
                      <p className="inline-block ml-2 text-2xl md:text-[36px]" style={{ color: '#fff', fontWeight: 'bold' }}>
                        {stat.unit}
                      </p>
                    </div>
            </div>
            </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 뉴스 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-primary font-bold mb-2">언론 속의 루트에너지</p>
              <h2 className="text-3xl font-bold">언론 속의 루트에너지에서 만나보세요</h2>
            </div>
            <Link href="/user/report" className="text-primary hover:underline font-medium">
              더보기 →
            </Link>
          </div>
          
          {/* 뉴스 캐러셀 */}
          <div className="relative">
            <button
              onClick={() => scrollNews('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              ref={newsRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {news.map((item) => (
                <div
                  key={item.id}
                  className="flex-none w-80 bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-48">
                  <Image
                      src={item.image}
                      alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-2">{item.date}</p>
                    <h3 className="text-lg font-bold mb-2 line-clamp-2">{item.title}</h3>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollNews('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* 파트너 섹션 */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              산업, 금융, 농업 등의 <span className="text-primary">파트너 네트워크</span>가 함께합니다.
            </h2>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center max-w-6xl mx-auto">
            {partners.map((partner, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-center"
              >
                <div className="relative w-24 h-12">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/inquiry" className="btn-primary inline-block">
              문의하기
            </Link>
          </div>
        </div>
      </section>

      {/* 문의 섹션 */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-4">
            <p className="text-primary font-bold mb-2">문의 안내</p>
            <h2 className="text-3xl font-bold mb-12">문의 사항이 있으신가요?</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* 왼쪽: 빠른 문의 */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">💬</div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">채팅상담 문의</h3>
                    <p className="text-sm text-white/90">실시간으로 상담을 받아보세요</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">📞</div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">전화 상담 문의</h3>
                    <p className="text-sm text-gray-600">02-XXXX-XXXX (평일 09:00-18:00)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽: 문의 폼 */}
            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-xl font-bold mb-6">이메일 문의</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="이름"
                    className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="tel"
                    placeholder="연락처"
                    className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <input
                  type="email"
                  placeholder="이메일"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <textarea
                  placeholder="문의 내용을 입력하세요"
                  rows={4}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button type="submit" className="w-full btn-primary">
                  문의하기
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 하단 CTA 섹션 */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-primary text-white">
        <div className="container-custom text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <span className="text-3xl">🌱</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">
                루트에너지는 사업의 시작을 이뤄낼 수 있게 하는<br />
                <span className="text-yellow-300">글로벌 네트워크(SII,Corp)</span>입니다.
          </h2>
            </div>
            <p className="text-lg mb-8 text-white/90">
              최근 서울에 재난상황자 업무한 있습니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
