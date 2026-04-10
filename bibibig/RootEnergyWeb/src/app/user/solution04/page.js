import Image from 'next/image';
import Link from 'next/link';

export default function Solution04Page() {
  return (
    <div className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/capture/solution04.png"
            alt="시민펀드"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-blue-600/80"></div>
        </div>
        <div className="container-custom text-center text-white relative z-10">
          <h1 className="text-5xl font-bold mb-4">시민펀드</h1>
          <p className="text-xl">시민과 함께하는 재생에너지 투자</p>
        </div>
      </section>

      {/* 시민펀드 소개 */}
      <section className="py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="section-title">시민펀드란?</h2>
            <p className="text-lg text-gray-600 mb-8">
              시민펀드는 일반 시민들이 소액으로 재생에너지 프로젝트에 투자하고 
              수익을 공유할 수 있는 투자 상품입니다. 
              재생에너지 확대에 기여하면서 안정적인 수익을 얻을 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 투자 특징 */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <h2 className="section-title text-center">투자 특징</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4 text-primary">💰</div>
              <h3 className="text-xl font-bold mb-3">소액 투자</h3>
              <p className="text-gray-600">
                10만원부터 시작하는 부담 없는 투자
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4 text-primary">📊</div>
              <h3 className="text-xl font-bold mb-3">안정적 수익</h3>
              <p className="text-gray-600">
                연 5~7% 예상 수익률
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4 text-primary">🌱</div>
              <h3 className="text-xl font-bold mb-3">환경 기여</h3>
              <p className="text-gray-600">
                재생에너지 확대에 직접 기여
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4 text-primary">🔒</div>
              <h3 className="text-xl font-bold mb-3">투명한 운영</h3>
              <p className="text-gray-600">
                실시간 발전량 및 수익 확인
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 투자 프로세스 */}
      <section className="py-20">
        <div className="container-custom">
          <h2 className="section-title text-center">투자 프로세스</h2>
          <div className="max-w-4xl mx-auto mt-12">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { step: '01', title: '회원가입', desc: '간편한 온라인 가입' },
                { step: '02', title: '펀드 선택', desc: '원하는 프로젝트 선택' },
                { step: '03', title: '투자금 입금', desc: '투자금액 결정 및 입금' },
                { step: '04', title: '수익 발생', desc: '월/분기별 수익 배당' },
                { step: '05', title: '원금 회수', desc: '만기 시 원금 회수' },
              ].map((item, index) => (
                <div key={item.step} className="relative">
                  <div className="bg-primary text-white p-6 rounded-lg text-center">
                    <div className="text-2xl font-bold mb-2">{item.step}</div>
                    <div className="font-bold mb-2">{item.title}</div>
                    <div className="text-sm">{item.desc}</div>
                  </div>
                  {index < 4 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 transform translate-x-1/2 -translate-y-1/2 text-primary text-2xl">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 진행중인 펀드 */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">진행중인 펀드</h2>
            <Link href="/funds/list" className="text-primary hover:underline">
              전체보기 →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <div className="w-full h-48 relative bg-gray-200">
                  <Image
                    src={`/images/solution04-fund${item}.jpg`}
                    alt={`펀드 ${item}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="text-sm text-primary font-bold mb-2">태양광 발전</div>
                  <h3 className="text-xl font-bold mb-3">
                    OO지역 태양광 발전소 프로젝트
                  </h3>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">예상 수익률</span>
                      <span className="font-bold">연 6.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">투자 기간</span>
                      <span className="font-bold">5년</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">최소 투자금</span>
                      <span className="font-bold">10만원</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>모집률</span>
                      <span className="font-bold">75%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <button className="w-full btn-primary">
                    투자하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container-custom">
          <h2 className="section-title text-center">자주 묻는 질문</h2>
          <div className="max-w-3xl mx-auto mt-12 space-y-4">
            <details className="bg-gray-50 p-6 rounded-lg">
              <summary className="font-bold cursor-pointer">최소 투자금액은 얼마인가요?</summary>
              <p className="mt-4 text-gray-600">
                10만원부터 투자 가능하며, 1만원 단위로 추가 투자가 가능합니다.
              </p>
            </details>
            <details className="bg-gray-50 p-6 rounded-lg">
              <summary className="font-bold cursor-pointer">수익은 언제 받을 수 있나요?</summary>
              <p className="mt-4 text-gray-600">
                프로젝트별로 다르지만, 일반적으로 월 또는 분기별로 배당금을 받을 수 있습니다.
              </p>
            </details>
            <details className="bg-gray-50 p-6 rounded-lg">
              <summary className="font-bold cursor-pointer">중도 해지가 가능한가요?</summary>
              <p className="mt-4 text-gray-600">
                투자 기간 중 중도 해지는 원칙적으로 불가능하나, 펀드 간 양도는 가능합니다.
              </p>
            </details>
            <details className="bg-gray-50 p-6 rounded-lg">
              <summary className="font-bold cursor-pointer">투자 리스크는 무엇인가요?</summary>
              <p className="mt-4 text-gray-600">
                발전량 저하, 전력 가격 변동 등의 리스크가 있으나, 정부의 재생에너지 정책과 
                장기 전력 구매 계약으로 안정적인 수익이 예상됩니다.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}

