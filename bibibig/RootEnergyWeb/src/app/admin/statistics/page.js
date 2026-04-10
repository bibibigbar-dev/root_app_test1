'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminStatisticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  // 샘플 데이터
  const todayStats = {
    today: 1234,
    yesterday: 1102,
    thisWeek: 8456,
    thisMonth: 32789,
    total: 156432,
  };

  const topPages = [
    { page: '/', views: 5432, avgTime: '2:34', bounceRate: '45%' },
    { page: '/about', views: 3210, avgTime: '3:12', bounceRate: '38%' },
    { page: '/solution01', views: 2876, avgTime: '4:23', bounceRate: '32%' },
    { page: '/press', views: 2345, avgTime: '2:45', bounceRate: '52%' },
    { page: '/recruitment', views: 1987, avgTime: '3:56', bounceRate: '28%' },
  ];

  const trafficSources = [
    { source: '직접 방문', visits: 4532, percentage: '45%' },
    { source: 'Google', visits: 3210, percentage: '32%' },
    { source: 'Naver', visits: 1456, percentage: '14%' },
    { source: 'SNS', visits: 902, percentage: '9%' },
  ];

  const deviceStats = [
    { device: 'Desktop', count: 5432, percentage: '54%' },
    { device: 'Mobile', count: 3876, percentage: '39%' },
    { device: 'Tablet', count: 692, percentage: '7%' },
  ];

  const browserStats = [
    { browser: 'Chrome', count: 6234, percentage: '62%' },
    { browser: 'Safari', count: 2345, percentage: '23%' },
    { browser: 'Edge', count: 987, percentage: '10%' },
    { browser: 'Firefox', count: 434, percentage: '5%' },
  ];

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">통계</h1>
            <p className="text-gray-600">방문자 및 게시판 통계를 확인할 수 있습니다.</p>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="7days">최근 7일</option>
            <option value="30days">최근 30일</option>
            <option value="3months">최근 3개월</option>
            <option value="1year">최근 1년</option>
          </select>
        </div>

        {/* 기본 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm mb-2">오늘 방문자</h3>
            <p className="text-3xl font-bold text-primary">{todayStats.today.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm mb-2">어제 방문자</h3>
            <p className="text-3xl font-bold">{todayStats.yesterday.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm mb-2">이번 주</h3>
            <p className="text-3xl font-bold">{todayStats.thisWeek.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm mb-2">이번 달</h3>
            <p className="text-3xl font-bold">{todayStats.thisMonth.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm mb-2">전체 누적</h3>
            <p className="text-3xl font-bold">{todayStats.total.toLocaleString()}</p>
          </div>
        </div>

        {/* 차트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 일별 방문자 추이 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">일별 방문자 추이 (최근 30일)</h2>
            <div className="h-64 flex items-end justify-between gap-2">
              {Array.from({ length: 30 }).map((_, i) => {
                const height = Math.random() * 100;
                return (
                  <div key={i} className="flex-1 bg-primary rounded-t" style={{ height: `${height}%` }}></div>
                );
              })}
            </div>
            <div className="flex justify-between mt-4 text-sm text-gray-600">
              <span>30일 전</span>
              <span>오늘</span>
            </div>
          </div>

          {/* 시간대별 방문자 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">시간대별 방문자 (24시간)</h2>
            <div className="h-64 flex items-end justify-between gap-1">
              {Array.from({ length: 24 }).map((_, i) => {
                const height = Math.random() * 100;
                return (
                  <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${height}%` }}></div>
                );
              })}
            </div>
            <div className="flex justify-between mt-4 text-sm text-gray-600">
              <span>0시</span>
              <span>12시</span>
              <span>23시</span>
            </div>
          </div>
        </div>

        {/* 인기 페이지 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">인기 페이지 Top 10</h2>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">페이지</th>
                <th className="px-6 py-3 text-left text-sm font-bold">조회수</th>
                <th className="px-6 py-3 text-left text-sm font-bold">평균 체류시간</th>
                <th className="px-6 py-3 text-left text-sm font-bold">이탈률</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topPages.map((page, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm">{page.page}</td>
                  <td className="px-6 py-4">{page.views.toLocaleString()}</td>
                  <td className="px-6 py-4">{page.avgTime}</td>
                  <td className="px-6 py-4">{page.bounceRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 유입 경로 및 디바이스/브라우저 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 유입 경로 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">유입 소스</h2>
            <div className="space-y-4">
              {trafficSources.map((source, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{source.source}</span>
                    <span className="text-gray-600">{source.visits.toLocaleString()} ({source.percentage})</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: source.percentage }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 디바이스 통계 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">디바이스별 방문</h2>
            <div className="space-y-4">
              {deviceStats.map((device, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{device.device}</span>
                    <span className="text-gray-600">{device.count.toLocaleString()} ({device.percentage})</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: device.percentage }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-bold mt-8 mb-4">브라우저별 방문</h3>
            <div className="space-y-4">
              {browserStats.map((browser, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{browser.browser}</span>
                    <span className="text-gray-600">{browser.count.toLocaleString()} ({browser.percentage})</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: browser.percentage }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 게시판 통계 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">게시판 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">156</div>
              <div className="text-gray-600">전체 게시글</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">45</div>
              <div className="text-gray-600">언론보도</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">32</div>
              <div className="text-gray-600">공지사항</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">23</div>
              <div className="text-gray-600">채용 공고</div>
            </div>
          </div>
        </div>

        {/* 문의 통계 */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">문의 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold mb-2">89</div>
              <div className="text-gray-600">전체 문의</div>
            </div>
            <div className="text-center p-6 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600 mb-2">23</div>
              <div className="text-gray-600">대기중</div>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">34</div>
              <div className="text-gray-600">처리중</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">32</div>
              <div className="text-gray-600">완료</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold mb-2">2.5일</div>
              <div className="text-gray-600">평균 처리시간</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

