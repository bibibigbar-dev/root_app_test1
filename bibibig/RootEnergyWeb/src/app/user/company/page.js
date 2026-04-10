import Image from 'next/image';

export default function CompanyPage() {
  return (
    <div className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/capture/company.png"
            alt="회사소개"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-blue-600/80"></div>
        </div>
        <div className="container-custom text-center text-white relative z-10">
          <h1 className="text-5xl font-bold mb-4">회사소개</h1>
          <p className="text-xl">지역과 함께 성장하는 재생에너지 전문기업</p>
        </div>
      </section>

      {/* 회사 개요 */}
      <section className="py-20">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">루트에너지</h2>
              <p className="text-lg text-gray-600 mb-4">
                루트에너지는 지역 주민과 함께하는 재생에너지 전문기업입니다.
              </p>
              <p className="text-gray-600 mb-4">
                우리는 재생에너지 사업의 성공적인 추진을 위해 지역 수용성을 최우선으로 생각하며, 
                지역 주민들이 직접 참여하고 수익을 공유하는 모델을 구축하고 있습니다.
              </p>
              <p className="text-gray-600">
                지속가능한 미래를 위해 지역사회와 함께 성장하는 것이 우리의 목표입니다.
              </p>
            </div>
            <div className="w-full h-96 relative bg-gray-200 rounded-lg">
              <Image
                src="/images/company-main.jpg"
                alt="루트에너지"
                fill
                className="object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 비전 & 미션 */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <h2 className="section-title text-center">비전 & 미션</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-primary mb-4">비전</h3>
              <p className="text-gray-600">
                지역과 함께 성장하는 대한민국 1등 재생에너지 기업
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-primary mb-4">미션</h3>
              <p className="text-gray-600">
                지역 주민과의 상생을 통한 지속가능한 재생에너지 생태계 구축
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 핵심 가치 */}
      <section className="py-20">
        <div className="container-custom">
          <h2 className="section-title text-center">핵심 가치</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-white">🤝</span>
              </div>
              <h3 className="text-xl font-bold mb-3">상생</h3>
              <p className="text-gray-600">
                지역 주민과 함께 성장하는 상생의 가치
              </p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-white">🌱</span>
              </div>
              <h3 className="text-xl font-bold mb-3">지속가능성</h3>
              <p className="text-gray-600">
                환경과 미래를 생각하는 지속가능한 발전
              </p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-white">💡</span>
              </div>
              <h3 className="text-xl font-bold mb-3">혁신</h3>
              <p className="text-gray-600">
                끊임없는 혁신으로 더 나은 솔루션 제공
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 연혁 */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <h2 className="section-title text-center">연혁</h2>
          <div className="max-w-3xl mx-auto mt-12">
            <div className="space-y-8">
              <div className="flex gap-8">
                <div className="w-32 flex-shrink-0 font-bold text-primary">2024</div>
                <div className="flex-1">
                  <p className="text-gray-600">재생에너지 프로젝트 100개 돌파</p>
                </div>
              </div>
              <div className="flex gap-8">
                <div className="w-32 flex-shrink-0 font-bold text-primary">2023</div>
                <div className="flex-1">
                  <p className="text-gray-600">시민펀드 플랫폼 오픈</p>
                </div>
              </div>
              <div className="flex gap-8">
                <div className="w-32 flex-shrink-0 font-bold text-primary">2022</div>
                <div className="flex-1">
                  <p className="text-gray-600">루트에너지 법인 설립</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

