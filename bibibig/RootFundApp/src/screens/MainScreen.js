import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Linking,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
    topBanner: null,
    topPromotionBanner: [],
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentReviewSlide, setCurrentReviewSlide] = useState(0);
  const [currentNewsSlide, setCurrentNewsSlide] = useState(0);
  const flatListRef = useRef(null);
  const reviewScrollRef = useRef(null);
  const newsScrollRef = useRef(null);

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
      const data = await ApiService.getMainData();
      const result = data?.result ?? data;
      console.log('메인 데이터 로드 성공:', result);
      setMainData({
        products: result?.product || [],
        siteStats: result?.site || null,
        reviews: result?.case_list || [],
        news: result?.news || [],
        faq: result?.faq || [],
        notice: result?.notice || [],
        topBanner: result?.top_banner_m_filepath || null,
        topPromotionBanner: result?.top_promotion_banner || [],
      });
    } catch (error) {
      console.error('메인 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerPress = () => {
    const url = 'https://rootenergy.co.kr/mobile/product/list';
    Linking.openURL(url).catch((err) =>
      console.error('배너 링크 열기 실패:', err)
    );
  };

  const formatCurrency = (value) => {
    if (!value) return '0';
    const stringValue = typeof value === 'string' ? value : String(value);
    const numericValue = stringValue.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 배너 슬라이드 렌더링
  const renderBannerSlide = ({ item, index }) => {
    // 상품 슬라이드
    if (item.type === 'product') {
      const product = item.data;
      return (
        <TouchableOpacity
          style={styles.slideContainer}
          onPress={() => console.log('상품 상세:', product.orderKey)}
          activeOpacity={0.9}
        >
          <View style={styles.slideInbox}>
            <View style={styles.slideCont}>
              <LinearGradient
                colors={['#F1F2FF', 'rgba(241,242,255,0.5)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.slideGradient}
              />
              <View style={styles.productBox}>
                <View style={styles.tagBox}>
                  {product.status && (
                    <View style={[
                      styles.statusBadge,
                      product.status === 'READY_F' && styles.statusWhite,
                      (product.status === 'FUNDING' || product.status === 'SUCCESS') && styles.statusRed,
                      (product.status === 'REPAY' || product.status === 'OVERDUE' || product.status === 'COLLECT') && styles.statusPink,
                    ]}>
                      <Text style={[
                        styles.statusText,
                        product.status === 'READY_F' && styles.statusWhiteText,
                        (product.status === 'REPAY' || product.status === 'OVERDUE' || product.status === 'COLLECT') && styles.statusPinkText,
                      ]}>{product.f_status_kr}</Text>
                    </View>
                  )}
                  <Text style={styles.tag}>#{product.term}</Text>
                  <Text style={styles.tag}>#{product.orderType}</Text>
                </View>
                <View style={styles.titImgFlex}>
                  <Text style={styles.productTitle} numberOfLines={1}>{product.orderName}</Text>
                </View>
              </View>
              <View style={styles.progressGroup}>
                <View style={styles.txtInfo}>
                  {product.orderType && (
                    <View style={styles.productTypeIcon}>
                      {product.orderType === '태양광' && (
                        <Image
                          source={require('../assets/images/img_product01_s.png')}
                          style={styles.productTypeImage}
                          resizeMode="contain"
                        />
                      )}
                      {product.orderType === '풍력' && (
                        <Image
                          source={require('../assets/images/img_product02_s.png')}
                          style={styles.productTypeImage}
                          resizeMode="contain"
                        />
                      )}
                      {product.orderType === 'ESS' && (
                        <Image
                          source={require('../assets/images/img_product01_s.png')}
                          style={styles.productTypeImage}
                          resizeMode="contain"
                        />
                      )}
                      {product.orderType === '전기차충전소' && (
                        <Image
                          source={require('../assets/images/img_product03_s.png')}
                          style={styles.productTypeImage}
                          resizeMode="contain"
                        />
                      )}
                    </View>
                  )}
                  <View style={styles.rateInfoContainer}>
                    <Text style={styles.rateText}>
                      연 <Text style={styles.rateValue}>{product.rate}</Text>%
                    </Text>
                    <Text style={styles.periodText}>
                      <Text style={styles.periodValue}>{product.period_text}</Text>개월
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={['#B8C5F2', '#5B7BE8', '#2c3db8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressVal, { width: `${product.percent}%` }]}
                  />
                </View>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressTotal}>
                    <Text style={styles.progressEmphasis}>{formatCurrency(product.investment)}원</Text>
                    {' / '}{formatCurrency(product.price)}원
                  </Text>
                  <Text style={styles.progressPct}>{product.percent}%</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.btnGo}>
              <Text style={styles.btnGoText}>상품 보러가기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }
    
    // 프로모션 배너 슬라이드
    if (item.type === 'promotion') {
      const promo = item.data;
      return (
        <TouchableOpacity
          style={styles.slideContainer}
          onPress={() => console.log('프로모션:', promo.idx)}
          activeOpacity={0.9}
        >
          <View style={styles.slideInbox}>
            <View style={[styles.slideCont, styles.promoCont]}>
              {promo.thumbnail && (
                <Image
                  source={{ uri: promo.thumbnail }}
                  style={styles.promoImage}
                  resizeMode="cover"
                />
              )}
            </View>
            <TouchableOpacity style={styles.btnGo}>
              <Text style={styles.btnGoText}>프로모션 보러가기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    // 고정 배너 (루트레터, 법인투자)
    if (item.type === 'fixed') {
      return (
        <TouchableOpacity
          style={styles.slideContainer}
          onPress={() => item.data.url && Linking.openURL(item.data.url)}
          activeOpacity={0.9}
        >
          <View style={styles.slideInbox}>
            <View style={[styles.slideCont, { backgroundColor: item.data.bgColor || '#F1F2FF' }]}>
              <View style={styles.titBox}>
                <Text style={styles.fixedTitle}>{item.data.title}</Text>
                <Text style={styles.fixedSubtitle}>{item.data.subtitle}</Text>
              </View>
              {item.data.linkText && (
                <TouchableOpacity
                  style={styles.viewPast}
                  onPress={() => item.data.linkUrl && Linking.openURL(item.data.linkUrl)}
                >
                  <Text style={styles.viewPastText}>{item.data.linkText}</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={[styles.btnGo, item.data.btnStyle]}>
              <Text style={styles.btnGoText}>{item.data.btnText}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  // 배너 데이터 준비
  const prepareBannerData = () => {
    const bannerData = [];
    
    // 상품 추가
    mainData.products.forEach(product => {
      bannerData.push({ type: 'product', data: product });
    });
    
    // 프로모션 배너 추가
    mainData.topPromotionBanner.forEach(promo => {
      bannerData.push({ type: 'promotion', data: promo });
    });
    
    // 고정 배너 추가 (루트레터)
    bannerData.push({
      type: 'fixed',
      data: {
        title: '격주 월요일,\n루트레터를 받아보세요',
        subtitle: '다양한 환경뉴스를 전해드려요!',
        linkText: '지난 회차 보기',
        linkUrl: 'https://page.stibee.com/archives/107118',
        url: 'https://page.stibee.com/subscriptions/107118',
        btnText: '무료 구독하기',
        btnStyle: styles.btnGoPurple,
        bgColor: '#E8E5FF',
      }
    });
    
    // 고정 배너 추가 (법인투자)
    bannerData.push({
      type: 'fixed',
      data: {
        title: '녹색 금융,\n법인투자자와 함께 합니다',
        subtitle: '가입부터 투자까지 1:1 상담 진행',
        url: 'https://rootenergy.co.kr/guide/corpForm',
        btnText: '상담 신청하기',
        btnStyle: styles.btnGoBlack,
        bgColor: '#F5F5F5',
      }
    });
    
    return bannerData;
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentSlide(viewableItems[0].index || 0);
    }
  }).current;

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
      <Header navigation={navigation} user={user} hideBorder={true} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mainData.topBanner && (
          <View style={styles.bannerWrapper}>
            <TouchableOpacity 
              onPress={handleBannerPress} 
              activeOpacity={0.9}
              style={styles.bannerContainer}
            >
              <Image
                source={{ uri: mainData.topBanner }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Main Banner Swiper */}
        <View style={styles.maBnSwiper}>
          <FlatList
            ref={flatListRef}
            data={prepareBannerData()}
            renderItem={renderBannerSlide}
            keyExtractor={(item, index) => `banner-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH}
            decelerationRate="fast"
            contentContainerStyle={styles.bannerListContent}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 50
            }}
          />
          {/* Pagination dots */}
          <View style={styles.swiperPagination}>
            {prepareBannerData().map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[
                  styles.paginationDot,
                  index === currentSlide && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        </View>

        {/* 환경과 함께 섹션 */}
        <View style={styles.environmentSection}>
          <View style={styles.titleBox}>
            <Text style={styles.sectionTitle}>환경과 함께,</Text>
          </View>
          <View style={styles.titleBoxRow}>
            <Text style={styles.sectionTitle}>믿을 수 있는 투자처</Text>
            {mainData.siteStats && (
              <Text style={styles.dateText}>
                *{new Date().toLocaleDateString('ko-KR')} 기준
              </Text>
            )}
          </View>

          {mainData.siteStats && (
            <View style={styles.dataList}>
              {/* 누적 대출액 */}
              <View style={styles.dataItem}>
                <View style={styles.dataInbox}>
                  <Image
                    source={require('../assets/images/ma_ico_environment01.png')}
                    style={styles.dataIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.dataTitle}>누적 대출액</Text>
                  <View style={styles.dataCon}>
                    <Text style={styles.dataText}>
                      {formatCurrency(mainData.siteStats.acc_loan_price)}억원
                    </Text>
                    <Text style={styles.dataCount}>
                      ▲ {formatCurrency(mainData.siteStats.gap_loan_price)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 누적 투자 건수 */}
              <View style={styles.dataItem}>
                <View style={styles.dataInbox}>
                  <Image
                    source={require('../assets/images/ma_ico_environment02.png')}
                    style={styles.dataIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.dataTitle}>누적 투자 건수</Text>
                  <View style={styles.dataCon}>
                    <Text style={styles.dataText}>
                      {formatCurrency(mainData.siteStats.acc_invest_count)}건
                    </Text>
                    <Text style={styles.dataCount}>
                      ▲ {mainData.siteStats.gap_invest_count}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 생산 발전량 박스 */}
              <View style={styles.dataBox}>
                <Image
                  source={require('../assets/images/ma_bg_environment01.png')}
                  style={styles.dataBoxBgImage}
                  resizeMode="cover"
                />
                <View style={styles.leftBox}>
                  <Text style={styles.dataBoxTitle}>생산 발전량</Text>
                  <View style={styles.dataBoxCon}>
                    <Text style={styles.dataBoxText}>
                      {formatCurrency(mainData.siteStats.production_power)}만
                    </Text>
                    <Text style={styles.dataBoxCount}>
                      ▲ {formatCurrency(mainData.siteStats.gap_production_power)}
                    </Text>
                  </View>
                </View>
                <View style={styles.rightBox}>
                  <Text style={styles.rightBoxText}>
                    대기오염 <Text style={styles.rightBoxEmphasis}>{formatCurrency(mainData.siteStats.air_pollution)}</Text> 감축{'\n'}
                    <Text style={styles.rightBoxEmphasis}>약 {formatCurrency(mainData.siteStats.tree_count)}그루🌲</Text>{'\n'}
                    이산화탄소 절감
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 투자자 후기 섹션 */}
        {mainData.reviews.length > 0 && (
          <View style={styles.reviewSwiper}>
            <View style={styles.titleBox}>
              <Text style={styles.sectionTitle}>투자자 후기</Text>
            </View>
            <ScrollView
              ref={reviewScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reviewScrollContent}
              style={styles.reviewScroll}
              snapToInterval={SCREEN_WIDTH - 64}
              snapToAlignment="start"
              decelerationRate="fast"
              onScroll={(event) => {
                const slideWidth = SCREEN_WIDTH - 64;
                const currentIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
                setCurrentReviewSlide(currentIndex);
              }}
              scrollEventThrottle={16}
            >
              {mainData.reviews.map((review, index) => (
                <View key={index} style={[
                  styles.reviewSlide,
                  index === mainData.reviews.length - 1 && { marginLeft: 'auto', marginRight: -15 }
                ]}>
                  <View style={styles.reviewInbox}>
                    <View style={[
                      styles.userBox,
                      review.fund_type === 'CLI' && styles.userBoxSkyblue,
                      review.fund_type === 'COM' && styles.userBoxMint,
                      review.fund_type === 'COR' && styles.userBoxGray,
                    ]}>
                      <Text style={styles.userBoxText}>
                        {review.fund_type === 'CLI' ? '기후' : 
                         review.fund_type === 'COM' ? '커뮤' : 
                         review.fund_type === 'COR' ? '법인' : '-'}
                      </Text>
                    </View>
                    <View style={styles.txtBox}>
                      <View style={styles.reviewTit}>
                        <Text style={styles.reviewTitText} numberOfLines={2}>
                          {review.subject.replace(/<br\s*\/?>/gi, '\n')}
                        </Text>
                      </View>
                      <View style={styles.reviewTxt}>
                        <Text style={styles.reviewTxtText} numberOfLines={5}>
                          {review.contents.replace(/<br\s*\/?>/gi, ' ')}
                        </Text>
                      </View>
                      <View style={styles.infoName}>
                        <Text style={styles.infoText}>{review.summary}</Text>
                        <Text style={styles.nameText}>{review.etc_text_1}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
            {/* Pagination dots */}
            <View style={styles.reviewPagination}>
              {mainData.reviews.map((_, index) => (
                <View
                  key={`review-dot-${index}`}
                  style={[
                    styles.paginationDot,
                    index === currentReviewSlide && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* 펀드 소개 */}
        <View style={[styles.section, styles.introSection]}>
          <View style={styles.titleBox}>
            <Text style={styles.sectionTitle}>펀드가 처음이라면?{'\n'}부담없이 시작하세요</Text>
          </View>
          <View style={styles.introContainer}>
            <View style={styles.introRow}>
              <View style={styles.introBox}>
                <View style={styles.introIconWrapper}>
                  <Image 
                    source={require('../assets/images/ma_ico_intro01.png')} 
                    style={styles.introIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.introText}>
                  <Text style={styles.introEmphasis}>최소 1만원</Text>부터{'\n'}투자 가능
                </Text>
              </View>
              <View style={styles.introBox}>
                <View style={styles.introIconWrapper}>
                  <Image 
                    source={require('../assets/images/ma_ico_intro02.png')} 
                    style={styles.introIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.introText}>
                  <Text style={styles.introEmphasis}>빠르고 간편</Text>한{'\n'}회원가입
                </Text>
              </View>
            </View>
            <View style={styles.introRow}>
              <View style={styles.introBox}>
                <View style={styles.introIconWrapper}>
                  <Image 
                    source={require('../assets/images/ma_ico_intro03.png')} 
                    style={styles.introIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.introText}>
                  눈속임 없는{'\n'}<Text style={styles.introEmphasis}>세후 수익률</Text>
                </Text>
              </View>
              <View style={styles.introBox}>
                <View style={styles.introIconWrapper}>
                  <Image 
                    source={require('../assets/images/ma_ico_intro04.png')} 
                    style={styles.introIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.introText}>
                  <Text style={styles.introEmphasis}>분기별 이자</Text>로{'\n'}쏠쏠한 용돈
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 카카오 배너 */}
        <View style={styles.kakaoBannerWrapper}>
          <TouchableOpacity 
            style={styles.kakaoBanner}
            onPress={() => Linking.openURL('https://pf.kakao.com/_CxaYbd')}
          >
            <Image 
              source={require('../assets/images/ma_bannerkakao01.png')} 
              style={styles.kakaoBannerImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* 최신 뉴스 */}
        {mainData.news.length > 0 && (
          <View style={[styles.section, { marginBottom: 0 }]}>
            <View style={[styles.titleBox, styles.titleBoxRow]}>
              <Text style={styles.sectionTitle}>최신뉴스</Text>
              <TouchableOpacity style={styles.moreButtonContainer}>
                <Text style={styles.moreButton}>전체보기 ›</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              ref={newsScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.newsScroll}
              snapToInterval={SCREEN_WIDTH - 64}
              snapToAlignment="start"
              decelerationRate="fast"
              onScroll={(event) => {
                const slideWidth = SCREEN_WIDTH - 64;
                const currentIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
                setCurrentNewsSlide(currentIndex);
              }}
              scrollEventThrottle={16}
            >
              {mainData.news.map((item, index) => (
                <TouchableOpacity key={index} style={styles.newsCard}>
                  <View style={styles.newsInbox}>
                    {item.thumbnail && (
                      <View style={styles.newsImgbox}>
                        <Image
                          source={{ uri: item.thumbnail }}
                          style={styles.newsImage}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    <View style={styles.newsTxtbox}>
                      <Text style={styles.newsTitle} numberOfLines={2}>
                        {item.subject}
                      </Text>
                      <View style={styles.newsSourceDate}>
                        <Text style={styles.newsSource}>{item.etc_text_1}</Text>
                        <Text style={styles.newsDateDivider}> | </Text>
                        <Text style={styles.newsDate}>
                          {item.recordtime?.substring(0, 10)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.newsPagination}>
              {mainData.news.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentNewsSlide === index && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* 루트소식 */}
        <View style={styles.whiteBox}>
          <View style={styles.titleBox}>
            <Text style={styles.sectionTitle}>루트소식</Text>
          </View>
          <View style={styles.rootNewsBox}>
            <View style={styles.rootNewsList}>
              <TouchableOpacity style={styles.rootNewsItem}>
                <View style={styles.rootNewsInbox}>
                  <Text style={styles.rootNewsCate}>채용</Text>
                  <Text style={styles.rootNewsTit}>기회/실무 파트 채용 중</Text>
                  <Image 
                    source={require('../assets/images/ico_rootnews01.png')} 
                    style={[styles.rootNewsIco, styles.rootNewsIco1]}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rootNewsItem}>
                <View style={styles.rootNewsInbox}>
                  <Text style={styles.rootNewsCate}>회사소개</Text>
                  <Text style={styles.rootNewsTit}>More for the future 저탄소 사회를 위해</Text>
                  <Image 
                    source={require('../assets/images/ico_rootnews02.png')} 
                    style={styles.rootNewsIco}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* 프로모션 이미지배너 */}
            <View style={styles.promotionBanner}>
              <TouchableOpacity style={styles.promotionInbox}>
                <Image 
                  source={require('../assets/images/main_banner_default.png')} 
                  style={styles.promotionImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 자주하는 질문 */}
        {mainData.faq.length > 0 && (
          <View style={styles.whiteBox}>
            <View style={[styles.titleBox, styles.titleBoxRow]}>
              <Text style={styles.sectionTitle}>자주하는질문</Text>
              <TouchableOpacity style={styles.moreButtonContainer}>
                <Text style={styles.moreButton}>전체보기 ›</Text>
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
              <TouchableOpacity style={styles.moreButtonContainer}>
                <Text style={styles.moreButton}>전체보기 ›</Text>
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
  bannerWrapper: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 8,
    backgroundColor: '#F1F2FF',
  },
  bannerContainer: {
    width: '100%',
    height: 60,
    borderRadius: 15,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  // Main Banner Swiper Styles
  maBnSwiper: {
    position: 'relative',
    overflow: 'visible',
  },
  bannerListContent: {
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 5,
  },
  slideInbox: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  slideCont: {
    position: 'relative',
    width: '100%',
    paddingBottom: '63.1%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  slideGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  promoCont: {
    backgroundColor: '#FFFFFF',
  },
  promoImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  productBox: {
    position: 'absolute',
    top: 26,
    left: 24,
    right: 24,
  },
  tagBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    color: '#2c3db8',
    fontSize: 15,
    lineHeight: 19.5,
    marginRight: 6,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 15,
    backgroundColor: '#222',
    marginRight: 7,
    marginLeft: -5,
  },
  statusText: {
    color: '#F6F6F6',
    fontSize: 14,
    fontWeight: '600',
  },
  statusWhite: {
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#db2852',
  },
  statusWhiteText: {
    color: '#db2852',
  },
  statusRed: {
    backgroundColor: '#db2852',
  },
  statusPink: {
    backgroundColor: 'rgba(219, 40, 82, 0.1)',
  },
  statusPinkText: {
    color: '#db2852',
  },
  statusGray: {
    backgroundColor: '#a3a7ab',
  },
  titImgFlex: {
    position: 'relative',
    paddingRight: 56,
    marginTop: 2,
  },
  productTitle: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '800',
    color: '#333',
  },
  progressGroup: {
    position: 'absolute',
    bottom: 10,
    left: 24,
    right: 24,
  },
  txtInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productTypeIcon: {
    marginRight: 60,
  },
  rateInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  productTypeImage: {
    width: 60,
    height: 60,
  },
  productTypeText: {
    fontSize: 24,
  },
  rateText: {
    fontSize: 14,
    color: '#333',
    marginRight: 36,
  },
  rateValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#333',
  },
  periodText: {
    fontSize: 14,
    color: '#333',
  },
  periodValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressVal: {
    height: '100%',
    backgroundColor: '#2c3db8',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTotal: {
    fontSize: 13,
    color: '#666',
  },
  progressEmphasis: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  progressPct: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  titBox: {
    position: 'absolute',
    top: 26,
    left: 24,
    right: 24,
  },
  fixedTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#333',
  },
  fixedSubtitle: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19.5,
    color: '#666',
  },
  viewPast: {
    position: 'absolute',
    bottom: 22,
    left: 24,
  },
  viewPastText: {
    color: '#666',
    fontSize: 12,
    textDecorationLine: 'underline',
    opacity: 0.7,
  },
  btnGo: {
    backgroundColor: '#2c3db8',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  btnGoText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
  },
  btnGoPurple: {
    backgroundColor: '#6d3ef2',
  },
  btnGoBlack: {
    backgroundColor: '#222',
  },
  swiperPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#aab1bc',
    marginHorizontal: 2,
  },
  paginationDotActive: {
    width: 16,
    backgroundColor: '#2c3db8',
  },
  section: {
    backgroundColor: '#F1F2FF',
    marginBottom: 12,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  environmentSection: {
    backgroundColor: '#F1F2FF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  titleBox: {
    marginBottom: 0,
  },
  titleBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    //marginBottom: ,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    lineHeight: 28,
    fontFamily: 'Pretendard',
  },
  dateText: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 8,
    alignSelf: 'flex-end',
  },
  moreButtonContainer: {
    marginLeft: 'auto',
    marginBottom: 2,
  },
  moreButton: {
    fontSize: 13,
    lineHeight: 20,
    color: '#333',
  },
  dataList: {
    marginTop: 16,
  },
  dataItem: {
    marginBottom: 8,
  },
  dataInbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  dataIcon: {
    width: 42,
    height: 42,
    marginRight: 12,
    borderRadius: 10,
  },
  dataTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#333',
  },
  dataCon: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  dataText: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    color: '#333',
  },
  dataCount: {
    color: '#ff5042',
    fontSize: 10,
    lineHeight: 16,
  },
  dataBox: {
    position: 'relative',
    height: 192,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#e9faf4',
    overflow: 'hidden',
  },
  dataBoxBgImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    width: '100%',
  },
  leftBox: {
    position: 'absolute',
    top: 16,
    left: 24,
  },
  dataBoxTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#333',
  },
  dataBoxCon: {
    marginTop: 2,
  },
  dataBoxText: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    color: '#333',
  },
  dataBoxCount: {
    color: '#2ebab4',
    fontSize: 10,
    lineHeight: 16,
  },
  rightBox: {
    position: 'absolute',
    top: 16,
    right: 24,
  },
  rightBoxText: {
    color: '#393f44',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'left',
  },
  rightBoxEmphasis: {
    color: '#2ebab4',
    fontWeight: '700',
  },
  reviewSwiper: {
    position: 'relative',
    padding: 15,
    paddingBottom: 25,
    overflow: 'hidden',
    backgroundColor: '#F1F2FF',
  },
  reviewPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  reviewScrollContent: {
    paddingLeft: 0,
    paddingRight: 16,
  },
  reviewScroll: {
    marginTop: 10,
  },
  reviewSlide: {
    width: SCREEN_WIDTH - 80,
    marginRight: 16,
  },
  reviewInbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 22,
    paddingLeft: 20,
    paddingBottom: 24,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(104, 111, 115, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  userBox: {
    width: 37,
    height: 37,
    marginTop: 2,
    marginRight: 12,
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userBoxSkyblue: {
    backgroundColor: '#197cff',
  },
  userBoxMint: {
    backgroundColor: '#2ebab4',
  },
  userBoxGray: {
    backgroundColor: '#666',
  },
  userBoxText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
  },
  txtBox: {
    flex: 1,
  },
  reviewTit: {
    minHeight: 39,
    maxHeight: 50,
    justifyContent: 'center',
  },
  reviewTitText: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    color: '#333',
  },
  reviewTxt: {
    height: 100,
    marginTop: 15,
  },
  reviewTxtText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 19.5,
  },
  infoName: {
    marginTop: 15,
  },
  infoText: {
    color: '#2c3db8',
    fontSize: 12,
    lineHeight: 16,
  },
  nameText: {
    color: '#bfc3c7',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  introContainer: {
    marginTop: 10,
    gap: 8,
  },
  introRow: {
    flexDirection: 'row',
    gap: 8,
  },
  introBox: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  introIconWrapper: {
    width: 37,
    height: 37,
    borderRadius: 32,
    backgroundColor: '#F1F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  introIcon: {
    width: 27,
    height: 27,
  },
  introText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
  },
  introEmphasis: {
    color: '#2c3db8',
    fontWeight: 'bold',
  },
  introSection: {
    backgroundColor: '#F1F2FF',
    paddingBottom: 0,
    marginBottom: 0,
  },
  kakaoBannerWrapper: {
    backgroundColor: '#F1F2FF',
    paddingTop: 26,
    paddingBottom: 16,
  },
  kakaoBanner: {
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 15,
  },
  kakaoBannerImage: {
    width: '100%',
    height: 130,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  newsScroll: {
    marginHorizontal: -20,
    paddingLeft: 17,
    paddingTop: 5,
  },
  newsPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  newsCard: {
    width: SCREEN_WIDTH - 80,
    marginRight: 16,
  },
  newsInbox: {
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(104, 111, 115, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  newsImgbox: {
    width: '100%',
    height: (SCREEN_WIDTH - 80) * 0.503,
  },
  newsImage: {
    width: '100%',
    height: '100%',
  },
  newsTxtbox: {
    padding: 20,
  },
  newsTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: '#333',
    height: 44,
    marginTop: -5,
  },
  newsSourceDate: {
    flexDirection: 'row',
    marginTop: 16,
  },
  newsSource: {
    fontSize: 12,
    lineHeight: 14,
    color: '#666',
  },
  newsDateDivider: {
    fontSize: 12,
    lineHeight: 14,
    color: '#bfc3c7',
    marginHorizontal: 4,
  },
  newsDate: {
    fontSize: 12,
    lineHeight: 14,
    color: '#bfc3c7',
  },
  rootNewsBox: {
  },
  rootNewsList: {
  },
  rootNewsItem: {
    marginTop: 8,
  },
  rootNewsInbox: {
    position: 'relative',
    paddingVertical: 20,
    paddingLeft: 20,
    paddingRight: 60,
    borderRadius: 10,
    backgroundColor: '#ebf0f8',
  },
  rootNewsCate: {
    color: '#197cff',
    fontSize: 12,
    lineHeight: 16,
  },
  rootNewsTit: {
    marginTop: 3,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  rootNewsIco: {
    position: 'absolute',
    top: '50%',
    right: 23,
    width: 28,
    height: 28,
    marginTop: 4,
  },
  rootNewsIco1: {
    right: 19,
    width: 29,
    marginTop: 4.5,
  },
  promotionBanner: {
    marginTop: 15,
  },
  promotionInbox: {
    borderRadius: 10,
    height: 250,
    overflow: 'hidden',
  },
  promotionImage: {
    width: '100%',
    height: '100%',
  },
  whiteBox: {
    backgroundColor: '#F1F2FF',
    marginBottom: 12,
    padding: 20,
  },
  faqItem: {
    paddingVertical: 15,
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
    paddingVertical: 15,
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
