import Image from 'next/image';

export default function Solution01Page() {
  return (
    <div className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/capture/solution01.png"
            alt="지역수용성 솔루션"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-blue-600/80"></div>
        </div>
        <div className="container-custom text-center text-white relative z-10">
          <h1 className="text-5xl font-bold mb-4">지역수용성 솔루션</h1>
          <p className="text-xl">지역 주민과 소통하고 함께 만드는 재생에너지</p>
        </div>
      </section>

      {/* 솔루션 소개 */}
      <section className="py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="section-title">지역수용성이란?</h2>
            <p className="text-lg text-gray-600 mb-8">
              재생에너지 프로젝트의 성공을 위해서는 지역 주민들의 이해와 동의가 필수적입니다. 
              루트에너지는 체계적인 지역 소통 프로그램과 참여 모델을 통해 
              지역 주민들과 함께 성공적인 재생에너지 프로젝트를 만들어갑니다.
            </p>
          </div>
        </div>
      </section>

      {/* 주요 서비스 */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <h2 className="section-title text-center">주요 서비스</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4">지역 소통 프로그램</h3>
              <p className="text-gray-600">
                주민설명회, 간담회, 공청회 등 체계적인 소통 프로그램 운영
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4">주민참여 모델</h3>
              <p className="text-gray-600">
                주민 직접 투자, 협동조합 설립 등 다양한 참여 방안 제시
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4">상생 프로그램</h3>
              <p className="text-gray-600">
                지역발전기금, 일자리 창출, 교육 프로그램 등 상생 방안 마련
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 프로세스 */}
      <section className="py-20">
        <div className="container-custom">
          <h2 className="section-title text-center">추진 프로세스</h2>
          <div className="max-w-4xl mx-auto mt-12">
            <div className="space-y-6">
              {[
                { step: '01', title: '지역 현황 분석', desc: '지역 특성과 주민 의견 파악' },
                { step: '02', title: '소통 계획 수립', desc: '맞춤형 소통 전략 및 프로그램 기획' },
                { step: '03', title: '주민 참여 유도', desc: '설명회, 간담회 등 소통 채널 운영' },
                { step: '04', title: '참여 모델 구축', desc: '주민 투자 및 수익 공유 모델 설계' },
                { step: '05', title: '지속적인 관리', desc: '사업 전 과정에서 지속적인 소통과 관리' },
              ].map((item) => (
                <div key={item.step} className="flex gap-6 items-start bg-gray-50 p-6 rounded-lg">
                  <div className="flex-shrink-0 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

