import Image from 'next/image';

export default function Solution02Page() {
  return (
    <div className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/capture/solution02.png"
            alt="지역주도 사업개발"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-blue-600/80"></div>
        </div>
        <div className="container-custom text-center text-white relative z-10">
          <h1 className="text-5xl font-bold mb-4">지역주도 사업개발</h1>
          <p className="text-xl">지역이 주인이 되는 재생에너지 프로젝트</p>
        </div>
      </section>

      {/* 솔루션 소개 */}
      <section className="py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="section-title">지역주도형 개발이란?</h2>
            <p className="text-lg text-gray-600 mb-8">
              지역 주민이 단순한 이해관계자가 아닌 사업의 주체로 참여하는 모델입니다. 
              지역 주민이 직접 사업을 기획하고, 투자하고, 운영하는 과정에서 
              실질적인 수익과 일자리를 창출할 수 있도록 지원합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 주요 특징 */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <h2 className="section-title text-center">주요 특징</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 text-primary">주민 중심 의사결정</h3>
              <p className="text-gray-600">
                사업의 모든 의사결정 과정에 지역 주민이 참여하여 
                지역의 특성과 요구사항을 반영합니다.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 text-primary">수익의 지역 환원</h3>
              <p className="text-gray-600">
                발전 수익의 상당 부분이 지역에 환원되어 
                지역 경제 활성화에 기여합니다.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 text-primary">지역 일자리 창출</h3>
              <p className="text-gray-600">
                건설, 운영, 유지보수 과정에서 지역 주민 우선 고용으로 
                양질의 일자리를 창출합니다.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 text-primary">지속가능한 발전</h3>
              <p className="text-gray-600">
                단기적 이익이 아닌 지역의 장기적인 발전을 목표로 
                지속가능한 사업 모델을 구축합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 지원 내용 */}
      <section className="py-20">
        <div className="container-custom">
          <h2 className="section-title text-center">루트에너지의 지원</h2>
          <div className="max-w-4xl mx-auto mt-12 space-y-6">
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">사업 기획 및 타당성 검토</h3>
              <p className="text-gray-600">
                지역 특성에 맞는 최적의 사업 모델 제안 및 경제성 분석
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">법인 설립 및 인허가 지원</h3>
              <p className="text-gray-600">
                주민참여법인 설립, 각종 인허가 절차 지원
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">자금 조달 지원</h3>
              <p className="text-gray-600">
                정책 자금, 시민펀드, 금융기관 대출 등 다양한 자금 조달 방안 제시
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">운영 및 유지보수</h3>
              <p className="text-gray-600">
                전문적인 운영 관리 시스템 제공 및 기술 지원
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

