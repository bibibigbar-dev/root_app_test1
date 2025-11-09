import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import Header from '../components/Header';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MainScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainData, setMainData] = useState({
    products: [],
    siteStats: null,
    reviews: [],
    news: [],
    faq: [],
    notice: [],
  });

  useEffect(() => {
    loadUserData();
    loadMainData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');

      if (!userData) {
        console.log('로그인 정보 없음 - Skip 모드로 진행');
        setUser(null);
        return;
      }

      const loginCheck = await ApiService.checkLoginExpiration();
      if (loginCheck.expired) {
        console.log('세션 만료:', loginCheck.reason);
        await ApiService.clearLoginData();
        return;
      }

      const currentUser = await ApiService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
      setUser(null);
    }
  };

  const loadMainData = async () => {
    try {
      // 메인 페이지 데이터 로드
      const response = await fetch('https://rootenergy.co.kr/app/main', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('메인 데이터 로드 성공:', data);
        setMainData({
          products: data.product || [],
          siteStats: data.site || null,
          reviews: data.case_list || [],
          news: data.news || [],
          faq: data.faq || [],
          notice: data.notice || [],
        });
      }
    } catch (error) {
      console.error('메인 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '0';
    const stringValue = typeof value === 'string' ? value : String(value);
    const numericValue = stringValue.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} user={user} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 환경과 함께 섹션 */}
        <View style={styles.section}>
          <View style={styles.titleBox}>
            <Text style={styles.sectionTitle}>환경과 함께,{'\n'}믿을 수 있는 투자처</Text>
            {mainData.siteStats && (
              <Text style={styles.dateText}>
                *{new Date().toLocaleDateString('ko-KR')} 기준
              </Text>
            )}
          </View>

          {mainData.siteStats && (
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>누적 대출액</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(mainData.siteStats.acc_loan_price)}억원
                  </Text>
                  <Text style={styles.statChange}>
                    ▲ {formatCurrency(mainData.siteStats.gap_loan_price)}
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>누적 투자 건수</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(mainData.siteStats.acc_invest_count)}건
                  </Text>
                  <Text style={styles.statChange}>
                    ▲ {mainData.siteStats.gap_invest_count}
                  </Text>
                </View>
              </View>

              <View style={styles.productionBox}>
                <View style={styles.productionLeft}>
                  <Text style={styles.statLabel}>생산 발전량</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(mainData.siteStats.production_power)}만
                  </Text>
                </View>
                <View style={styles.productionRight}>
                  <Text style={styles.productionText}>
                    대기오염 {formatCurrency(mainData.siteStats.air_pollution)} 감축{'\n'}
                    약 {formatCurrency(mainData.siteStats.tree_count)}그루🌲{'\n'}
                    이산화탄소 절감
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 투자자 후기 섹션 */}
        {mainData.reviews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.titleBox}>
              <Text style={styles.sectionTitle}>투자자 후기</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.reviewScroll}
            >
              {mainData.reviews.map((review, index) => (
                <View key={index} style={styles.reviewCard}>
                  <View style={[
                    styles.reviewBadge,
                    review.fund_type === 'CLI' && styles.badgeSkyblue,
                    review.fund_type === 'COM' && styles.badgeMint,
                    review.fund_type === 'COR' && styles.badgeGray,
                  ]}>
                    <Text style={styles.reviewBadgeText}>
                      {review.fund_type === 'CLI' ? '기후' : 
                       review.fund_type === 'COM' ? '커뮤' : 
                       review.fund_type === 'COR' ? '법인' : '-'}
                    </Text>
                  </View>
                  <Text style={styles.reviewTitle} numberOfLines={1}>
                    {review.subject}
                  </Text>
                  <Text style={styles.reviewContent} numberOfLines={2}>
                    {review.contents}
                  </Text>
                  <View style={styles.reviewFooter}>
                    <Text style={styles.reviewInfo}>{review.summary}</Text>
                    <Text style={styles.reviewName}>{review.etc_text_1}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 펀드 소개 */}
        <View style={styles.section}>
          <View style={styles.titleBox}>
            <Text style={styles.sectionTitle}>펀드가 처음이라면?{'\n'}부담없이 시작하세요</Text>
          </View>
          <View style={styles.introContainer}>
            <View style={styles.introRow}>
              <View style={styles.introBox}>
                <Text style={styles.introText}>
                  <Text style={styles.introEmphasis}>최소 1만원</Text>부터{'\n'}투자 가능
                </Text>
              </View>
              <View style={styles.introBox}>
                <Text style={styles.introText}>
                  <Text style={styles.introEmphasis}>빠르고 간편</Text>한{'\n'}회원가입
                </Text>
              </View>
            </View>
            <View style={styles.introRow}>
              <View style={styles.introBox}>
                <Text style={styles.introText}>
                  눈속임 없는{'\n'}<Text style={styles.introEmphasis}>세후 수익률</Text>
                </Text>
              </View>
              <View style={styles.introBox}>
                <Text style={styles.introText}>
                  <Text style={styles.introEmphasis}>분기별 이자</Text>로{'\n'}쏠쏠한 용돈
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 최신 뉴스 */}
        {mainData.news.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.titleBox, styles.titleBoxRow]}>
              <Text style={styles.sectionTitle}>최신뉴스</Text>
              <TouchableOpacity>
                <Text style={styles.moreButton}>전체보기</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.newsScroll}
            >
              {mainData.news.map((item, index) => (
                <TouchableOpacity key={index} style={styles.newsCard}>
                  {item.thumbnail && (
                    <Image
                      source={{ uri: item.thumbnail }}
                      style={styles.newsImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.newsContent}>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                      {item.subject}
                    </Text>
                    <View style={styles.newsFooter}>
                      <Text style={styles.newsSource}>{item.etc_text_1}</Text>
                      <Text style={styles.newsDate}>
                        {item.recordtime?.substring(0, 10)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 자주하는 질문 */}
        {mainData.faq.length > 0 && (
          <View style={styles.whiteBox}>
            <View style={[styles.titleBox, styles.titleBoxRow]}>
              <Text style={styles.sectionTitle}>자주하는질문</Text>
              <TouchableOpacity>
                <Text style={styles.moreButton}>전체보기</Text>
              </TouchableOpacity>
            </View>
            {mainData.faq.slice(0, 3).map((item, index) => (
              <View key={index} style={styles.faqItem}>
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQ}>Q</Text>
                  <Text style={styles.faqTitle}>{item.subject}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 공지사항 */}
        {mainData.notice.length > 0 && (
          <View style={styles.whiteBox}>
            <View style={[styles.titleBox, styles.titleBoxRow]}>
              <Text style={styles.sectionTitle}>공지사항</Text>
              <TouchableOpacity>
                <Text style={styles.moreButton}>전체보기</Text>
              </TouchableOpacity>
            </View>
            {mainData.notice.slice(0, 3).map((item, index) => (
              <View key={index} style={styles.noticeItem}>
                <Text style={styles.noticeTitle} numberOfLines={1}>
                  {item.subject}
                </Text>
                <Text style={styles.noticeDate}>
                  {item.recordtime?.substring(0, 10)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 공시지표 */}
        {mainData.siteStats && (
          <View style={styles.whiteBox}>
            <View style={styles.titleBox}>
              <Text style={styles.sectionTitle}>공시지표</Text>
              <Text style={styles.dateText}>
                *{new Date().toLocaleDateString('ko-KR')} 기준
              </Text>
            </View>
            <View style={styles.indicatorContainer}>
              <View style={styles.indicatorBox}>
                <Text style={styles.indicatorLabel}>누적대출액</Text>
                <Text style={styles.indicatorValue}>
                  {formatCurrency(mainData.siteStats.loan_price)}원
                </Text>
                <View style={styles.indicatorPct}>
                  <Text style={styles.indicatorPctLabel}>상환율</Text>
                  <Text style={styles.indicatorPctValue}>
                    {mainData.siteStats.repay_per}%
                  </Text>
                </View>
              </View>
              <View style={styles.indicatorBox}>
                <Text style={styles.indicatorLabel}>대출잔액</Text>
                <Text style={styles.indicatorValue}>
                  {formatCurrency(mainData.siteStats.balance)}원
                </Text>
                <View style={styles.indicatorPct}>
                  <Text style={styles.indicatorPctLabel}>연체율</Text>
                  <Text style={styles.indicatorPctValue}>
                    {mainData.siteStats.overdue}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    padding: 20,
  },
  titleBox: {
    marginBottom: 20,
  },
  titleBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    lineHeight: 28,
  },
  dateText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
  },
  moreButton: {
    fontSize: 14,
    color: '#007AFF',
  },
  statsContainer: {
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    color: '#007AFF',
  },
  productionBox: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  productionLeft: {
    flex: 1,
  },
  productionRight: {
    flex: 1,
  },
  productionText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },
  reviewScroll: {
    marginHorizontal: -20,
    paddingLeft: 20,
  },
  reviewCard: {
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
  },
  reviewBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 12,
  },
  badgeSkyblue: {
    backgroundColor: '#E3F2FD',
  },
  badgeMint: {
    backgroundColor: '#E0F2F1',
  },
  badgeGray: {
    backgroundColor: '#F5F5F5',
  },
  reviewBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  reviewContent: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewInfo: {
    fontSize: 12,
    color: '#999999',
  },
  reviewName: {
    fontSize: 12,
    color: '#999999',
  },
  introContainer: {
    gap: 12,
  },
  introRow: {
    flexDirection: 'row',
    gap: 12,
  },
  introBox: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  introText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  introEmphasis: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  newsScroll: {
    marginHorizontal: -20,
    paddingLeft: 20,
  },
  newsCard: {
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  newsImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0F0F0',
  },
  newsContent: {
    padding: 12,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newsSource: {
    fontSize: 12,
    color: '#999999',
  },
  newsDate: {
    fontSize: 12,
    color: '#999999',
  },
  whiteBox: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    padding: 20,
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqQ: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 12,
  },
  faqTitle: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  noticeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  noticeTitle: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    marginRight: 12,
  },
  noticeDate: {
    fontSize: 12,
    color: '#999999',
  },
  indicatorContainer: {
    gap: 12,
  },
  indicatorBox: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  indicatorLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  indicatorValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  indicatorPct: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
  },
  indicatorPctLabel: {
    fontSize: 12,
    color: '#666666',
  },
  indicatorPctValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default MainScreen;
