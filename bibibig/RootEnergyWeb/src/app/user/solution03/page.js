import Image from 'next/image';

export default function Solution03Page() {
  return (
    <div className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/capture/solution03.png"
            alt="RE100/탄소중립 솔루션"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-blue-600/80"></div>
        </div>
        <div className="container-custom text-center text-white relative z-10">
          <h1 className="text-5xl font-bold mb-4">RE100/탄소중립 솔루션</h1>
          <p className="text-xl">기업의 지속가능한 미래를 위한 맞춤형 솔루션</p>
        </div>
      </section>

      {/* RE100 소개 */}
      <section className="py-20">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">RE100이란?</h2>
              <p className="text-lg text-gray-600 mb-4">
                RE100(Renewable Energy 100%)은 기업이 사용하는 전력의 100%를 
                재생에너지로 충당하겠다는 자발적 캠페인입니다.
              </p>
              <p className="text-gray-600 mb-4">
                글로벌 기업들의 필수 요구사항이 되어가고 있으며, 
                국내 기업들도 적극적으로 동참하고 있습니다.
              </p>
            </div>
            <div className="w-full h-96 relative bg-gray-200 rounded-lg">
              <Image
                src="/images/solution03-re100.jpg"
                alt="RE100"
                fill
                className="object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 솔루션 */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <h2 className="section-title text-center">RE100 달성 방법</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4">녹색 프리미엄</h3>
              <p className="text-gray-600 mb-4">
                한전으로부터 재생에너지 전력을 구매하는 방식
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 가장 간편한 방법</li>
                <li>• 추가 요금 부담</li>
                <li>• 즉시 이행 가능</li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4">제3자 PPA</h3>
              <p className="text-gray-600 mb-4">
                재생에너지 발전사업자로부터 직접 전력 구매
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 장기 고정 가격</li>
                <li>• 안정적 공급</li>
                <li>• 가격 경쟁력</li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4">자가발전</h3>
              <p className="text-gray-600 mb-4">
                직접 재생에너지 설비를 설치하여 전력 생산
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 완전한 통제권</li>
                <li>• 초기 투자 필요</li>
                <li>• 장기적 경제성</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 탄소중립 */}
      <section className="py-20">
        <div className="container-custom">
          <h2 className="section-title text-center">탄소중립 컨설팅</h2>
          <div className="max-w-4xl mx-auto mt-12">
            <div className="space-y-6">
              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">탄소배출량 진단</h3>
                <p className="text-gray-600">
                  기업의 Scope 1, 2, 3 전반에 걸친 탄소배출량 측정 및 분석
                </p>
              </div>
              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">감축 로드맵 수립</h3>
                <p className="text-gray-600">
                  기업 특성에 맞는 단계적 탄소감축 전략 및 실행 계획 수립
                </p>
              </div>
              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">재생에너지 전환</h3>
                <p className="text-gray-600">
                  RE100 이행을 통한 Scope 2 배출량 감축
                </p>
              </div>
              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">탄소배출권 관리</h3>
                <p className="text-gray-600">
                  탄소배출권 거래 전략 수립 및 이행 지원
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기대효과 */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <h2 className="section-title text-center">기대효과</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            <div className="text-center">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold mb-2">환경 개선</h3>
              <p className="text-gray-600">탄소배출 감축 기여</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">비용 절감</h3>
              <p className="text-gray-600">장기적 전력비 절감</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-2">기업 가치 향상</h3>
              <p className="text-gray-600">ESG 평가 개선</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-2">경쟁력 강화</h3>
              <p className="text-gray-600">글로벌 공급망 유지</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

